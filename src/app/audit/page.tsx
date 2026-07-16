import { ClipboardCheck } from "lucide-react";
import { requireSession, canEditBinders } from "@/lib/auth/session";
import { getJournals } from "@/lib/journals";
import { assignedJournalIds } from "@/lib/journal-access";
import { loadServerDrafts } from "@/lib/binder-store";
import { inlineToPlainText } from "@/lib/rich-text";
import AuditJournalTable, { type AuditJournalRow } from "@/components/audit/AuditJournalTable";

export const dynamic = "force-dynamic";

// Binder QA / Audit — landing page. Lists the journals the user can reach and
// links each to its QA report. Read-only: it never mutates any binder.
export default async function AuditHubPage() {
  const session = await requireSession();
  if (!canEditBinders(session.role)) {
    return (
      <main className="mx-auto w-full max-w-2xl p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Binder QA / Audit</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have access to binder auditing.</p>
      </main>
    );
  }

  const allJournals = await getJournals();
  const allowed = await assignedJournalIds(session);
  const journals = allowed === "ALL" ? allJournals : allJournals.filter((j) => allowed.has(j.id));
  const drafts = await loadServerDrafts();

  const rows: AuditJournalRow[] = journals.map((journal) => {
    const stored = drafts[journal.id];
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
    };
  });

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <ClipboardCheck size={22} className="text-slate-700" />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Binder QA / Audit</h1>
          <p className="text-sm text-slate-500">Review a created binder against the quality-assurance checklist and generate a report.</p>
        </div>
      </div>

      {journals.length === 0 ? (
        <p className="text-sm text-slate-500">No journals available to audit.</p>
      ) : (
        <AuditJournalTable rows={rows} />
      )}
    </main>
  );
}
