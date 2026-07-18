import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireSession, canEditBinders } from "@/lib/auth/session";
import { getJournals } from "@/lib/journals";
import { assignedJournalIds } from "@/lib/journal-access";
import { loadServerDrafts } from "@/lib/binder-store";
import { prisma } from "@/lib/prisma";
import { inlineToPlainText } from "@/lib/rich-text";
import QaJournalTable, { type QaJournalRow } from "@/components/qa/QaJournalTable";

export const dynamic = "force-dynamic";

// Binder QA hub: assemble the final binder from manuscripts, run the AI QA
// check, and forward passing binders to the internal review team.
export default async function QaHubPage() {
  const session = await requireSession();
  if (!canEditBinders(session.role)) {
    return (
      <main className="mx-auto w-full max-w-2xl p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Binder QA</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have access to binder QA.</p>
      </main>
    );
  }

  const allJournals = await getJournals();
  const allowed = await assignedJournalIds(session);
  const journals = allowed === "ALL" ? allJournals : allJournals.filter((j) => allowed.has(j.id));
  const drafts = await loadServerDrafts();

  // Latest binder per journal → its review status + latest completed QA run.
  const binderIds = Object.values(drafts).map((d) => d.binderId);
  const binders = binderIds.length
    ? await prisma.binder.findMany({
        where: { id: { in: binderIds } },
        select: {
          id: true,
          reviewStatus: true,
          qaRuns: {
            where: { status: "COMPLETE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { passed: true, counts: true },
          },
        },
      })
    : [];
  const binderById = new Map(binders.map((b) => [b.id, b]));

  const rows: QaJournalRow[] = journals.map((journal) => {
    const stored = drafts[journal.id];
    const binder = stored ? binderById.get(stored.binderId) : undefined;
    const lastRun = binder?.qaRuns[0];
    const issue = stored
      ? [
          stored.draft.issueVolume && `Vol ${stored.draft.issueVolume}`,
          stored.draft.issueNumber && `Issue ${stored.draft.issueNumber}`,
          stored.draft.issueYear,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;
    return {
      id: journal.id,
      name: inlineToPlainText(journal.name),
      abbreviation: journal.abbreviation,
      issue: issue || null,
      hasSaved: Boolean(stored),
      reviewStatus: binder?.reviewStatus ?? null,
      lastRun: lastRun
        ? { passed: lastRun.passed, failCount: (lastRun.counts as { fail?: number } | null)?.fail ?? null }
        : null,
    };
  });

  const inReview = rows.filter((r) => r.reviewStatus === "IN_INTERNAL_REVIEW").length;

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-slate-700" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Binder QA</h1>
            <p className="text-sm text-slate-500">
              Combine manuscripts into the final binder, run the AI quality check, and forward passing binders to the internal review team.
            </p>
          </div>
        </div>
        <Link
          href="/qa/review"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Internal review queue{inReview ? ` (${inReview})` : ""}
        </Link>
      </div>

      {journals.length === 0 ? (
        <p className="text-sm text-slate-500">No journals available.</p>
      ) : (
        <QaJournalTable rows={rows} />
      )}
    </main>
  );
}
