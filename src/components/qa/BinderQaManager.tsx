"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileUp,
  Layers,
  Loader2,
  PlayCircle,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import type { AuditReport } from "@/lib/binder-audit";
import type { BinderFileSummary } from "@/lib/binder-files";
import type { QaRunSummary } from "@/lib/binder-qa";
import AuditReportView from "@/components/audit/AuditReportView";
import PrintReportButton from "@/components/audit/PrintReportButton";
import { submitForInternalReview, returnToDraft } from "@/app/actions/qa";

export type QaArticleRow = {
  id: string;
  title: string;
  authors: string | null;
  tocPage: string | null;
  manuscript: { fileId: string; filename: string | null; pageCount: number | null; byteSize: number } | null;
};

export type QaIssueOption = { id: string; label: string; inReview: boolean };

type Props = {
  binderId: string;
  journalId: string;
  journalName: string;
  issueLabel: string;
  issues: QaIssueOption[];
  reviewStatus: "DRAFT" | "IN_INTERNAL_REVIEW";
  submittedAt: string | null;
  admin: boolean;
  aiConfigured: boolean;
  frontMatter: BinderFileSummary | null;
  cover: BinderFileSummary | null;
  assembled: (BinderFileSummary & { stale: boolean }) | null;
  articles: QaArticleRow[];
  runs: QaRunSummary[];
  gate: { passed: boolean; reason: string };
  latestReport: AuditReport | null;
  latestReportIsCurrent: boolean;
};

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function BinderQaManager(props: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // slot key
  const [assembling, setAssembling] = useState(false);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(props.latestReport);
  const [reportIsFresh, setReportIsFresh] = useState(false);
  // Set when the user opened a historical run instead of the latest one.
  const [viewingRun, setViewingRun] = useState<{ id: string; createdAt: string } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [pendingSubmit, startSubmit] = useTransition();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const locked = props.reviewStatus === "IN_INTERNAL_REVIEW";
  const manuscriptsDone = props.articles.filter((a) => a.manuscript).length;

  async function upload(slot: string, kind: "FRONT_MATTER" | "MANUSCRIPT" | "COVER", articleId: string | null, file: File) {
    setError(null);
    setUploading(slot);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      if (articleId) form.set("articleId", articleId);
      const res = await fetch(`/api/binders/${props.binderId}/files`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function removeFile(fileId: string) {
    setError(null);
    const res = await fetch(`/api/binders/${props.binderId}/files?fileId=${fileId}`, { method: "DELETE" });
    if (!res.ok) setError("Could not remove the file.");
    router.refresh();
  }

  async function assemble() {
    setError(null);
    setAssembling(true);
    try {
      const res = await fetch(`/api/binders/${props.binderId}/assemble`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Assembly failed (${res.status})`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assembly failed");
    } finally {
      setAssembling(false);
    }
  }

  async function runQa() {
    setError(null);
    setRunning(true);
    try {
      const res = await fetch(`/api/binders/${props.binderId}/qa`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `QA run failed (${res.status})`);
      if (body?.report) {
        setReport(body.report as AuditReport);
        setReportIsFresh(true);
        setViewingRun(null);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "QA run failed");
    } finally {
      setRunning(false);
    }
  }

  async function viewRun(run: QaRunSummary) {
    setError(null);
    try {
      const res = await fetch(`/api/binders/${props.binderId}/qa?runId=${run.id}`);
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.report) throw new Error(body?.error ?? "Report not found");
      setReport(body.report as AuditReport);
      setReportIsFresh(false);
      setViewingRun({ id: run.id, createdAt: run.createdAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that run's report");
    }
  }

  function submit(withOverride: boolean) {
    setError(null);
    startSubmit(async () => {
      const result = await submitForInternalReview(
        props.binderId,
        withOverride ? overrideReason : undefined,
      );
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function pullBack() {
    setError(null);
    startSubmit(async () => {
      const result = await returnToDraft(props.binderId);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  const uploadSlot = (slot: string, kind: "FRONT_MATTER" | "MANUSCRIPT" | "COVER", articleId: string | null, label: string) => (
    <>
      <input
        ref={(el) => {
          fileInputs.current[slot] = el;
        }}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(slot, kind, articleId, file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading != null || locked}
        onClick={() => fileInputs.current[slot]?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {uploading === slot ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />}
        {label}
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{props.journalName}</h1>
            {props.issues.length > 1 ? (
              <label className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                Issue
                <select
                  value={props.binderId}
                  onChange={(e) => router.push(`/qa/${props.journalId}?issue=${e.target.value}`)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-slate-500"
                >
                  {props.issues.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.label}
                      {it.inReview ? " — in review" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm text-slate-500">{props.issueLabel}</p>
            )}
          </div>
          {locked ? (
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                In internal review{props.submittedAt ? ` since ${new Date(props.submittedAt).toLocaleDateString()}` : ""}
              </span>
              <button
                type="button"
                onClick={pullBack}
                disabled={pendingSubmit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Undo2 size={14} /> Return to draft
              </button>
            </div>
          ) : null}
        </div>
        {!props.aiConfigured ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            AI review is not configured (ANTHROPIC_API_KEY is unset) — QA runs will include the rule-based PDF checks only, and visual checks are marked for manual review.
          </p>
        ) : null}
        {error ? <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      </div>

      {/* Step 1 · Files */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">1 · Front matter & manuscripts</h2>
          <span className="text-xs text-slate-500">
            {props.frontMatter ? "Front matter ✓" : "Front matter missing"} · {manuscriptsDone}/{props.articles.length} manuscripts
          </span>
        </header>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={15} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">Front matter (initial pages)</p>
                <p className="text-xs text-slate-500">
                  {props.frontMatter
                    ? `${props.frontMatter.filename ?? "front-matter.pdf"} · ${props.frontMatter.pageCount ?? "?"} pages · ${mb(props.frontMatter.byteSize)}`
                    : "Export the binder's internal pages as PDF from the dashboard, then upload it here."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {props.frontMatter ? (
                <>
                  <a
                    href={`/api/binders/${props.binderId}/files/${props.frontMatter.id}`}
                    target="_blank"
                    className="text-xs text-sky-700 underline"
                  >
                    View
                  </a>
                  {!locked ? (
                    <button type="button" onClick={() => void removeFile(props.frontMatter!.id)} className="text-slate-400 hover:text-rose-600" aria-label="Remove front matter">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </>
              ) : null}
              {uploadSlot("front-matter", "FRONT_MATTER", null, props.frontMatter ? "Replace PDF" : "Upload PDF")}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={15} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">Cover spread (optional)</p>
                <p className="text-xs text-slate-500">
                  {props.cover
                    ? `${props.cover.filename ?? "cover-spread.pdf"} · ${props.cover.pageCount ?? "?"} page(s) · ${mb(props.cover.byteSize)} — reviewed by QA, printed separately (never merged into the binder)`
                    : "Use “Send cover to Binder QA” in the dashboard's export panel, or upload the cover-spread PDF here. Without it, cover checks rely on the binder pages only."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {props.cover ? (
                <>
                  <a
                    href={`/api/binders/${props.binderId}/files/${props.cover.id}`}
                    target="_blank"
                    className="text-xs text-sky-700 underline"
                  >
                    View
                  </a>
                  {!locked ? (
                    <button type="button" onClick={() => void removeFile(props.cover!.id)} className="text-slate-400 hover:text-rose-600" aria-label="Remove cover">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </>
              ) : null}
              {uploadSlot("cover", "COVER", null, props.cover ? "Replace PDF" : "Upload PDF")}
            </div>
          </div>

          {props.articles.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              No TOC articles — add contents rows in the dashboard first.
            </p>
          ) : (
            props.articles.map((article, index) => (
              <div key={article.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {index + 1}. {article.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {article.authors || "No authors"} · TOC p.{article.tocPage || "?"}
                    {article.manuscript
                      ? ` · ${article.manuscript.filename ?? "manuscript.pdf"} (${article.manuscript.pageCount ?? "?"} pages)`
                      : " · no manuscript uploaded"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {article.manuscript ? (
                    <>
                      <a
                        href={`/api/binders/${props.binderId}/files/${article.manuscript.fileId}`}
                        target="_blank"
                        className="text-xs text-sky-700 underline"
                      >
                        View
                      </a>
                      {!locked ? (
                        <button
                          type="button"
                          onClick={() => void removeFile(article.manuscript!.fileId)}
                          className="text-slate-400 hover:text-rose-600"
                          aria-label={`Remove manuscript for ${article.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  {uploadSlot(`ms-${article.id}`, "MANUSCRIPT", article.id, article.manuscript ? "Replace PDF" : "Upload PDF")}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Step 2 · Assemble */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">2 · Assemble the final binder</h2>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm text-slate-600">
            {props.assembled ? (
              <>
                <span className="font-medium text-slate-800">assembled-binder.pdf</span> · {props.assembled.pageCount ?? "?"} pages ·{" "}
                {mb(props.assembled.byteSize)} · built {new Date(props.assembled.createdAt).toLocaleString()}
                {props.assembled.stale ? (
                  <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    Stale — files changed since assembly
                  </span>
                ) : null}
              </>
            ) : (
              "Merges the front matter and every manuscript (in TOC order) into one print-ready PDF."
            )}
          </div>
          <div className="flex items-center gap-2">
            {props.assembled ? (
              <a href={`/api/binders/${props.binderId}/files/${props.assembled.id}`} target="_blank" className="text-xs text-sky-700 underline">
                View assembled PDF
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => void assemble()}
              disabled={assembling || locked}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {assembling ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
              {props.assembled ? "Re-assemble" : "Assemble binder"}
            </button>
          </div>
        </div>
      </section>

      {/* Step 3 · Run QA */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">3 · AI quality check</h2>
        </header>
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Rule-based PDF checks (geometry, fonts, junk text, TOC cross-verification) plus Claude&apos;s visual review of every page.
            </p>
            <button
              type="button"
              onClick={() => void runQa()}
              disabled={running || !props.assembled || locked}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
              {running ? "Running QA…" : "Run AI QA check"}
            </button>
          </div>
          {running ? (
            <p className="mt-2 text-xs text-slate-500">
              This can take a few minutes on large binders — keep this tab open.
            </p>
          ) : null}

          {props.runs.length ? (
            <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {props.runs.slice(0, 8).map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-3 text-xs text-slate-600">
                  <span>
                    {new Date(run.createdAt).toLocaleString()}
                    {run.createdByName ? ` · ${run.createdByName}` : ""}
                    {run.model ? ` · ${run.model}` : " · rules only"}
                    {!run.current && run.status === "COMPLETE" ? " · (older assembly)" : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    {run.status === "RUNNING" ? (
                      <span className="text-slate-400">running…</span>
                    ) : run.status === "ERROR" ? (
                      <span className="font-semibold text-rose-700" title={run.error ?? undefined}>error</span>
                    ) : run.passed ? (
                      <span className="font-semibold text-emerald-700">passed</span>
                    ) : (
                      <span className="font-semibold text-rose-700">{run.counts?.fail ?? "?"} fail(s)</span>
                    )}
                    {run.status === "COMPLETE" ? (
                      <button
                        type="button"
                        onClick={() => void viewRun(run)}
                        className={`underline ${viewingRun?.id === run.id ? "font-semibold text-slate-900" : "text-sky-700"}`}
                      >
                        {viewingRun?.id === run.id ? "viewing" : "view report"}
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* Step 4 · Forward to internal review */}
      {!locked ? (
        <section className={`rounded-xl border p-4 ${props.gate.passed ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">4 · Forward to the internal review team</h2>
              <p className={`mt-0.5 text-sm ${props.gate.passed ? "text-emerald-700" : "text-slate-600"}`}>{props.gate.reason}</p>
            </div>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={pendingSubmit || !props.gate.passed}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {pendingSubmit ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit to internal review
            </button>
          </div>
          {!props.gate.passed && props.admin ? (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin override</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Submitting despite a failing (or missing) QA run is recorded in the activity log with your reason.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for overriding the QA gate…"
                  className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={pendingSubmit || overrideReason.trim().length < 5}
                  className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Override & submit
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Latest report */}
      {report ? (
        <div>
          <div className="mb-2 flex items-center justify-between print:hidden">
            <h2 className="text-sm font-semibold text-slate-900">
              {viewingRun ? `QA report · run of ${new Date(viewingRun.createdAt).toLocaleString()}` : "Latest QA report"}
              {!viewingRun && !reportIsFresh && !props.latestReportIsCurrent ? (
                <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  From an older assembly — re-run QA
                </span>
              ) : null}
            </h2>
            <PrintReportButton />
          </div>
          <AuditReportView report={report} />
        </div>
      ) : null}
    </div>
  );
}
