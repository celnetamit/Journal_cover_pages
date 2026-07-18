import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession, isAdmin } from "@/lib/auth/session";
import { canManageJournal } from "@/lib/journal-access";
import { getJournals } from "@/lib/journals";
import { prisma } from "@/lib/prisma";
import { listBinderFiles } from "@/lib/binder-files";
import { listQaRuns, qaGateState, getQaRunReport } from "@/lib/binder-qa";
import { aiReviewConfigured } from "@/lib/binder-ai-audit";
import { inlineToPlainText } from "@/lib/rich-text";
import BinderQaManager, { type QaArticleRow, type QaIssueOption } from "@/components/qa/BinderQaManager";

export const dynamic = "force-dynamic";

function issueLabelOf(b: { volume: string | null; issue: string | null; year: number | null; monthRange: string | null }): string {
  return (
    [
      b.volume && `Vol ${b.volume}`,
      b.issue && `Issue ${b.issue}`,
      [b.monthRange, b.year].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" · ") || "Untitled issue"
  );
}

// QA workspace for one journal. Any saved issue can be selected (?issue=<binderId>);
// defaults to the most recently updated one.
export default async function QaJournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ journalId: string }>;
  searchParams: Promise<{ issue?: string }>;
}) {
  const { journalId } = await params;
  const { issue } = await searchParams;
  const session = await requireSession();
  if (!(await canManageJournal(session, journalId))) redirect("/");

  const journals = await getJournals();
  const journal = journals.find((j) => j.id === journalId);
  if (!journal) notFound();

  const binders = await prisma.binder.findMany({
    where: { journalId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, volume: true, issue: true, year: true, monthRange: true, overrides: true, reviewStatus: true, submittedAt: true },
  });

  if (binders.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Link href="/qa" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> All journals
        </Link>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">{inlineToPlainText(journal.name)}</h1>
        <p className="mt-2 text-sm text-slate-500">
          No saved issue for this journal yet — build and save the binder in the{" "}
          <Link href="/" className="text-sky-700 underline">dashboard</Link> first, then come back to assemble and QA it.
        </p>
      </main>
    );
  }

  // Default to the newest issue that has a saved draft (matching how the /qa
  // hub picks its row via loadServerDrafts) rather than bare newest-by-update.
  const binder =
    binders.find((b) => b.id === issue) ?? binders.find((b) => b.overrides != null) ?? binders[0];
  const issues: QaIssueOption[] = binders.map((b) => ({
    id: b.id,
    label: issueLabelOf(b),
    inReview: b.reviewStatus === "IN_INTERNAL_REVIEW",
  }));

  const [files, runs, articleRows] = await Promise.all([
    listBinderFiles(binder.id),
    listQaRuns(binder.id),
    prisma.article.findMany({
      where: { binderId: binder.id },
      orderBy: { order: "asc" },
      select: { id: true, title: true, authors: true, startPage: true },
    }),
  ]);
  const gate = await qaGateState(binder.id, runs);

  const frontMatter = files.find((f) => f.kind === "FRONT_MATTER") ?? null;
  const cover = files.find((f) => f.kind === "COVER") ?? null;
  const assembled = files.find((f) => f.kind === "ASSEMBLED") ?? null;
  const manuscriptByArticle = new Map(files.filter((f) => f.kind === "MANUSCRIPT").map((f) => [f.articleId, f]));

  const articles: QaArticleRow[] = articleRows.map((a) => {
    const m = manuscriptByArticle.get(a.id) ?? null;
    return {
      id: a.id,
      title: inlineToPlainText(a.title),
      authors: a.authors,
      tocPage: a.startPage,
      manuscript: m ? { fileId: m.id, filename: m.filename, pageCount: m.pageCount, byteSize: m.byteSize } : null,
    };
  });

  // Assembly is stale when a merged source PDF was replaced after it was built
  // (the cover is reviewed separately and does not stale the assembly).
  const assembledStale = Boolean(
    assembled &&
      files.some(
        (f) =>
          f.kind !== "ASSEMBLED" &&
          f.kind !== "COVER" &&
          new Date(f.createdAt) > new Date(assembled.createdAt),
      ),
  );

  const latestComplete = runs.find((r) => r.status === "COMPLETE") ?? null;
  const latestReport = latestComplete ? await getQaRunReport(latestComplete.id, binder.id) : null;

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/qa" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> All journals
        </Link>
      </div>

      <BinderQaManager
        binderId={binder.id}
        journalId={journalId}
        journalName={inlineToPlainText(journal.name)}
        issueLabel={issueLabelOf(binder)}
        issues={issues}
        reviewStatus={binder.reviewStatus}
        submittedAt={binder.submittedAt?.toISOString() ?? null}
        admin={isAdmin(session.role)}
        aiConfigured={aiReviewConfigured()}
        frontMatter={frontMatter}
        cover={cover}
        assembled={assembled ? { ...assembled, stale: assembledStale } : null}
        articles={articles}
        runs={runs}
        gate={{ passed: gate.passed, reason: gate.reason }}
        latestReport={latestReport}
        latestReportIsCurrent={Boolean(latestComplete?.current)}
      />
    </main>
  );
}
