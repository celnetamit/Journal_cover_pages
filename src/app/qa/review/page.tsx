import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { requireSession, canEditBinders } from "@/lib/auth/session";
import { assignedJournalIds } from "@/lib/journal-access";
import { prisma } from "@/lib/prisma";
import { inlineToPlainText } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

// Internal review queue: binders forwarded by the QA gate, newest first. The
// correction workflow itself stays in the dashboard — this page is the team's
// worklist, linking each binder to its QA workspace/report.
export default async function QaReviewQueuePage() {
  const session = await requireSession();
  if (!canEditBinders(session.role)) {
    return (
      <main className="mx-auto w-full max-w-2xl p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Internal review queue</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have access to the review queue.</p>
      </main>
    );
  }

  const allowed = await assignedJournalIds(session);
  const binders = await prisma.binder.findMany({
    where: {
      reviewStatus: "IN_INTERNAL_REVIEW",
      ...(allowed === "ALL" ? {} : { journalId: { in: Array.from(allowed) } }),
    },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      volume: true,
      issue: true,
      year: true,
      submittedAt: true,
      journalId: true,
      journal: { select: { name: true, abbreviation: true } },
      submittedBy: { select: { name: true, email: true } },
      qaRuns: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { passed: true, counts: true },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-4">
        <Link href="/qa" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Binder QA
        </Link>
      </div>
      <div className="mb-6 flex items-center gap-2">
        <Inbox size={22} className="text-slate-700" />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Internal review queue</h1>
          <p className="text-sm text-slate-500">Binders that passed the AI QA gate (or were admin-overridden) and await the team&apos;s review.</p>
        </div>
      </div>

      {binders.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Nothing in the queue — binders appear here once they pass QA and are submitted.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Journal</th>
                <th className="px-4 py-2.5 w-40">Issue</th>
                <th className="px-4 py-2.5 w-44">Submitted</th>
                <th className="px-4 py-2.5 w-32">Last QA</th>
              </tr>
            </thead>
            <tbody>
              {binders.map((b) => {
                const lastRun = b.qaRuns[0];
                const failCount = (lastRun?.counts as { fail?: number } | null)?.fail;
                return (
                  <tr key={b.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/qa/${b.journalId}`} className="font-medium text-slate-900 hover:underline">
                        {inlineToPlainText(b.journal.name)}
                      </Link>
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{b.journal.abbreviation}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {[b.volume && `Vol ${b.volume}`, b.issue && `Issue ${b.issue}`, b.year].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {b.submittedAt ? new Date(b.submittedAt).toLocaleString() : "—"}
                      {b.submittedBy ? ` · ${b.submittedBy.name ?? b.submittedBy.email}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {!lastRun ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">Overridden</span>
                      ) : lastRun.passed ? (
                        <span className="font-semibold text-emerald-700">Passed</span>
                      ) : (
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Overridden{failCount != null ? ` (${failCount} fail)` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
