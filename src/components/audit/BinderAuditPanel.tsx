"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardCheck, X, Printer } from "lucide-react";
import type { Journal } from "@/lib/journals";
import type { BinderDraft } from "@/lib/binder-content";
import { auditBinder } from "@/lib/binder-audit";
import AuditReportView from "@/components/audit/AuditReportView";

// Editor-side entry point for the QA module: audits the binder currently on
// screen (the in-memory draft), so the check reflects unsaved edits. The report
// opens in a centered modal so it reads at a comfortable width even when the
// trigger lives in a narrow editor sidebar.
export default function BinderAuditPanel({
  journal,
  draft,
}: {
  journal: Journal | null;
  draft: BinderDraft | null;
}) {
  const [open, setOpen] = useState(false);

  const report = useMemo(
    () => (open && journal ? auditBinder(journal, draft, { hasSavedBinder: draft != null }) : null),
    [open, journal, draft],
  );

  // Print ONLY the report. The dashboard registers a `beforeprint` handler that
  // swaps in the 9-page binder, so we flag <body> to let a scoped print rule hide
  // everything except this portalled report, then clear the flag afterwards.
  function printReport() {
    const cleanup = () => {
      document.body.classList.remove("audit-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    document.body.classList.add("audit-printing");
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  if (!journal) return null;

  const overlay =
    open && report ? (
      <div
        className="audit-print-portal fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label="Binder QA report"
        onClick={() => setOpen(false)}
      >
        <div
          className="audit-print-root my-auto w-full max-w-3xl rounded-xl bg-white shadow-2xl [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-xl border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur print:hidden">
            <h2 className="text-sm font-semibold text-slate-900">Binder QA report</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={printReport}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer size={14} /> Print / PDF
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <X size={14} /> Close
              </button>
            </div>
          </div>
          <div className="p-5">
            <AuditReportView report={report} />
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-800">Binder QA / Audit</p>
        <p className="text-xs text-slate-500">Check the current binder against the QA checklist and generate a report.</p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        <ClipboardCheck size={16} className="shrink-0" />
        Audit this binder
      </button>

      {overlay && typeof document !== "undefined" ? createPortal(overlay, document.body) : null}
    </div>
  );
}
