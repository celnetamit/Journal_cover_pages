import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { canManageJournal } from "@/lib/journal-access";
import { getJournals } from "@/lib/journals";
import { loadServerDrafts } from "@/lib/binder-store";
import { auditBinder } from "@/lib/binder-audit";
import AuditReportView from "@/components/audit/AuditReportView";
import PrintReportButton from "@/components/audit/PrintReportButton";

export const dynamic = "force-dynamic";

// QA report for a single journal's latest saved binder. Server-rendered and
// read-only — running an audit changes nothing.
export default async function AuditReportPage({ params }: { params: Promise<{ journalId: string }> }) {
  const { journalId } = await params;
  const session = await requireSession();
  if (!(await canManageJournal(session, journalId))) redirect("/");

  const journals = await getJournals();
  const journal = journals.find((j) => j.id === journalId);
  if (!journal) notFound();

  const drafts = await loadServerDrafts();
  const stored = drafts[journalId] ?? null;
  const report = auditBinder(journal, stored?.draft ?? null, { hasSavedBinder: stored != null });

  return (
    <main className="mx-auto w-full max-w-4xl p-6 print:max-w-none print:p-8 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href="/audit" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> All journals
        </Link>
        <PrintReportButton />
      </div>
      <AuditReportView report={report} />
    </main>
  );
}
