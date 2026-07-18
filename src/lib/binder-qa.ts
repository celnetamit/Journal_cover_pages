import "server-only";
import { prisma } from "@/lib/prisma";
import { getJournalById, type Journal } from "@/lib/journals";
import type { BinderDraft } from "@/lib/binder-content";
import { extractPdfFacts, auditBinderPdf, auditCoverPdf } from "@/lib/binder-pdf-audit";
import { runAiAudit } from "@/lib/binder-ai-audit";
import {
  summarize,
  type AuditModule,
  type AuditReport,
  type AuditStatus,
} from "@/lib/binder-audit";
import { inlineToPlainText } from "@/lib/rich-text";
import type { AssemblyMeta } from "@/lib/binder-files";

// Orchestrates one QA run over a binder's ASSEMBLED PDF: deterministic PDF
// checks + the AI review, merged into a single AuditReport (the same shape the
// draft audit renders) and persisted as a BinderQaRun. A binder may only be
// forwarded to the internal review team when its latest run against the
// *current* assembled file passed (see qaGateState).

const plain = (v: string | null | undefined) => inlineToPlainText(v ?? "").trim();

export type QaRunSummary = {
  id: string;
  status: "RUNNING" | "COMPLETE" | "ERROR";
  passed: boolean;
  counts: Record<AuditStatus, number> | null;
  model: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
  createdByName: string | null;
  /** True when this run audited the binder's current assembled file. */
  current: boolean;
};

function issueLabel(draft: Partial<BinderDraft>): string {
  const parts: string[] = [];
  if (plain(draft.issueVolume)) parts.push(`Volume ${plain(draft.issueVolume)}`);
  if (plain(draft.issueNumber)) parts.push(`Issue ${plain(draft.issueNumber)}`);
  const when = [plain(draft.issueMonthRange), plain(draft.issueYear)].filter(Boolean).join(" ");
  if (when) parts.push(when);
  return parts.length ? parts.join(" · ") : "Issue metadata not set";
}

function buildReport(journal: Journal, draft: Partial<BinderDraft>, modules: AuditModule[]): AuditReport {
  const counts: Record<AuditStatus, number> = { pass: 0, fail: 0, warn: 0, manual: 0, na: 0 };
  for (const mod of modules) for (const item of mod.items) counts[item.status] += 1;
  return {
    journalName: plain(draft.journalTitle) || plain(journal.name),
    issueLabel: issueLabel(draft),
    hasSavedBinder: true,
    modules,
    summary: modules.map((mod) => ({ label: mod.title.replace(/^(PDF|AI) · /, ""), status: summarize(mod) })),
    counts,
    readyForPublication: counts.fail === 0,
  };
}

export type RunQaResult = { ok: true; runId: string } | { ok: false; error: string };

// A run that has shown no progress for this long is considered orphaned (e.g.
// the process was killed mid-run) and is marked ERROR instead of blocking
// forever in "running…".
const RUN_STALE_MS = 15 * 60 * 1000;

// Run synchronously (the API route awaits it). A RUNNING row exists while the
// run is in flight so the UI can show progress if it polls.
export async function runBinderQa(binderId: string, userId: string): Promise<RunQaResult> {
  const binder = await prisma.binder.findUnique({
    where: { id: binderId },
    select: { id: true, journalId: true, overrides: true },
  });
  if (!binder) return { ok: false, error: "Binder not found." };

  // Reap orphaned RUNNING rows, then refuse to stack a concurrent run (each
  // one is a paid AI review of the same PDF).
  await prisma.binderQaRun.updateMany({
    where: { binderId, status: "RUNNING", createdAt: { lt: new Date(Date.now() - RUN_STALE_MS) } },
    data: { status: "ERROR", error: "Run was interrupted (timed out or the server restarted).", finishedAt: new Date() },
  });
  const inFlight = await prisma.binderQaRun.findFirst({ where: { binderId, status: "RUNNING" }, select: { id: true } });
  if (inFlight) return { ok: false, error: "A QA run is already in progress for this binder — wait for it to finish." };

  const [assembled, coverFile] = await Promise.all([
    prisma.binderFile.findFirst({ where: { binderId, kind: "ASSEMBLED" }, orderBy: { createdAt: "desc" } }),
    prisma.binderFile.findFirst({ where: { binderId, kind: "COVER" }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!assembled) return { ok: false, error: "No assembled binder PDF — assemble the binder first." };

  const journal = await getJournalById(binder.journalId);
  if (!journal) return { ok: false, error: "Journal not found." };

  const draft = (binder.overrides ?? {}) as Partial<BinderDraft>;
  const assembly = (assembled.meta ?? null) as AssemblyMeta | null;

  const run = await prisma.binderQaRun.create({
    data: { binderId, status: "RUNNING", assembledFileId: assembled.id, createdById: userId },
    select: { id: true },
  });

  try {
    // Prisma already returns Uint8Array for Bytes — no defensive copy needed;
    // extractPdfFacts makes the single copy pdfjs requires.
    const pdfBytes = assembled.data;
    const facts = await extractPdfFacts(pdfBytes);
    const auditCtx = { journal, draft, assembly };
    const pdfModules = auditBinderPdf(facts, auditCtx);

    // Cover spread (optional): audited separately, never merged into the binder.
    const coverBytes = coverFile ? coverFile.data : null;
    if (coverBytes) {
      try {
        const coverFacts = await extractPdfFacts(coverBytes);
        pdfModules.unshift(auditCoverPdf(coverFacts, auditCtx));
      } catch (err) {
        console.error("Cover PDF could not be analysed", err);
        pdfModules.unshift({
          id: "pdf-cover",
          title: "PDF · Modules 2/13 — Cover spread",
          items: [
            {
              label: "Cover PDF readable",
              status: "fail",
              requirement: "Valid PDF",
              detail: "The uploaded cover PDF could not be parsed — re-export and upload it again.",
            },
          ],
        });
      }
    }

    const ai = await runAiAudit({
      pdf: pdfBytes,
      pageCount: facts.pageCount,
      journal,
      draft,
      assembly,
      cover: coverBytes,
    });
    if (ai.status === "error") {
      await prisma.binderQaRun.update({
        where: { id: run.id },
        data: { status: "ERROR", error: ai.error, finishedAt: new Date() },
      });
      return { ok: false, error: `AI review failed: ${ai.error}` };
    }

    const report = buildReport(journal, draft, [...pdfModules, ...ai.modules]);
    await prisma.binderQaRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETE",
        report: report as unknown as object,
        counts: report.counts as unknown as object,
        passed: report.readyForPublication,
        model: ai.status === "ok" ? ai.model : null,
        finishedAt: new Date(),
      },
    });
    return { ok: true, runId: run.id };
  } catch (err) {
    console.error("Binder QA run failed", err);
    const message = err instanceof Error ? err.message : "Unknown QA failure";
    await prisma.binderQaRun.update({
      where: { id: run.id },
      data: { status: "ERROR", error: message, finishedAt: new Date() },
    });
    return { ok: false, error: message };
  }
}

const name = (u: { name: string | null; email: string | null } | null) => u?.name ?? u?.email ?? null;

export async function listQaRuns(binderId: string): Promise<QaRunSummary[]> {
  const [runs, assembled] = await Promise.all([
    prisma.binderQaRun.findMany({
      where: { binderId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        passed: true,
        counts: true,
        model: true,
        error: true,
        createdAt: true,
        finishedAt: true,
        assembledFileId: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.binderFile.findFirst({ where: { binderId, kind: "ASSEMBLED" }, select: { id: true } }),
  ]);
  return runs.map((r) => ({
    id: r.id,
    status: r.status,
    passed: r.passed,
    counts: (r.counts ?? null) as QaRunSummary["counts"],
    model: r.model,
    error: r.error,
    createdAt: r.createdAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    createdByName: name(r.createdBy),
    current: r.assembledFileId != null && r.assembledFileId === assembled?.id,
  }));
}

// Report lookup is scoped to the binder so a run id from another journal can
// never be read through this binder's route (IDOR guard).
export async function getQaRunReport(runId: string, binderId: string): Promise<AuditReport | null> {
  const run = await prisma.binderQaRun.findFirst({
    where: { id: runId, binderId },
    select: { report: true },
  });
  return (run?.report as unknown as AuditReport) ?? null;
}

export type QaGateState = {
  /** The latest COMPLETE run against the current assembled file, if any. */
  latestCurrentRunId: string | null;
  passed: boolean;
  reason: string;
};

// The submission gate: a binder may go to internal review only when
//  (a) the most recent completed run audited the CURRENT assembled file,
//  (b) that run had zero fails, and
//  (c) the assembly itself is still current — no source PDF replaced and no
//      TOC change since it was built (a passing run on a stale assembly says
//      nothing about what would actually be sent to print).
// Callers that already fetched the runs list can pass it to avoid re-querying.
export async function qaGateState(binderId: string, prefetchedRuns?: QaRunSummary[]): Promise<QaGateState> {
  const runs = prefetchedRuns ?? (await listQaRuns(binderId));
  const latestCurrent = runs.find((r) => r.current && r.status === "COMPLETE");
  if (!latestCurrent) {
    return {
      latestCurrentRunId: null,
      passed: false,
      reason: "No completed QA run for the current assembled binder — run the AI QA check first.",
    };
  }
  if (!latestCurrent.passed) {
    const fails = latestCurrent.counts?.fail ?? "some";
    return {
      latestCurrentRunId: latestCurrent.id,
      passed: false,
      reason: `The latest QA run has ${fails} failing check(s) — fix them and re-run QA.`,
    };
  }

  const stale = await assemblyStaleReason(binderId);
  if (stale) {
    return { latestCurrentRunId: latestCurrent.id, passed: false, reason: stale };
  }
  return { latestCurrentRunId: latestCurrent.id, passed: true, reason: "Latest QA run passed." };
}

// Non-null when the assembled PDF no longer reflects its inputs: a merged
// source file was replaced/removed after assembly, or the TOC articles changed.
export async function assemblyStaleReason(binderId: string): Promise<string | null> {
  const assembled = await prisma.binderFile.findFirst({
    where: { binderId, kind: "ASSEMBLED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, meta: true },
  });
  if (!assembled) return "No assembled binder PDF — assemble the binder first.";

  const [newerSources, articles] = await Promise.all([
    prisma.binderFile.count({
      where: { binderId, kind: { in: ["FRONT_MATTER", "MANUSCRIPT"] }, createdAt: { gt: assembled.createdAt } },
    }),
    prisma.article.findMany({ where: { binderId }, select: { id: true } }),
  ]);
  if (newerSources > 0) {
    return "A front-matter or manuscript PDF was replaced after the last assembly — re-assemble and re-run QA.";
  }

  const meta = assembled.meta as unknown as AssemblyMeta | null;
  const assembledIds = new Set((meta?.articles ?? []).map((a) => a.articleId));
  const currentIds = articles.map((a) => a.id);
  if (assembledIds.size !== currentIds.length || currentIds.some((id) => !assembledIds.has(id))) {
    return "The Table of Contents changed after the last assembly — re-assemble and re-run QA.";
  }
  return null;
}
