import type { AuditReport, AuditStatus, AuditItem } from "@/lib/binder-audit";

// Presentational, hook-free renderer for an AuditReport so it can be used from
// server components (the /audit route) and client components (the editor panel)
// alike. Styling uses Tailwind utilities only — no global CSS is touched.

const STATUS_META: Record<AuditStatus, { label: string; badge: string; dot: string }> = {
  pass: { label: "Pass", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  fail: { label: "Fail", badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
  warn: { label: "Review", badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  manual: { label: "Manual", badge: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500" },
  na: { label: "N/A", badge: "bg-slate-100 text-slate-500 ring-slate-500/20", dot: "bg-slate-400" },
};

function StatusBadge({ status }: { status: AuditStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

function CountChip({ status, count }: { status: AuditStatus; count: number }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}>
      <span className="tabular-nums">{count}</span> {meta.label}
    </span>
  );
}

function ItemRow({ item }: { item: AuditItem }) {
  return (
    <li className="flex items-start justify-between gap-3 border-t border-slate-100 py-2 first:border-t-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{item.label}</p>
        {item.detail ? <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p> : null}
        {item.requirement ? (
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">Standard: {item.requirement}</p>
        ) : null}
      </div>
      <StatusBadge status={item.status} />
    </li>
  );
}

export default function AuditReportView({ report }: { report: AuditReport }) {
  const ready = report.readyForPublication;
  return (
    <div className="space-y-6">
      {/* Verdict banner */}
      <div
        className={`rounded-xl border p-4 print:break-inside-avoid ${
          ready ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quality assurance report</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{report.journalName || "Untitled journal"}</h2>
            <p className="text-sm text-slate-600">{report.issueLabel}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 text-sm font-bold ${ready ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
            {ready ? "Ready for publication" : "Not ready — fix failures"}
          </div>
        </div>
        {!report.hasSavedBinder ? (
          <p className="mt-2 text-xs text-amber-700">
            No saved issue found — this audits the journal record with blank issue metadata. Create/save an issue for a complete check.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <CountChip status="pass" count={report.counts.pass} />
          <CountChip status="fail" count={report.counts.fail} />
          <CountChip status="warn" count={report.counts.warn} />
          <CountChip status="manual" count={report.counts.manual} />
          <CountChip status="na" count={report.counts.na} />
        </div>
      </div>

      {/* Module 15 · Final checklist summary */}
      <section className="rounded-xl border border-slate-200 bg-white print:break-inside-avoid">
        <header className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Module 15 · Final QA summary</h3>
        </header>
        <ul className="grid gap-x-6 gap-y-1 px-4 py-3 sm:grid-cols-2">
          {report.summary.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 py-1">
              <span className="truncate text-sm text-slate-700">{row.label}</span>
              <StatusBadge status={row.status} />
            </li>
          ))}
        </ul>
      </section>

      {/* Per-module detail */}
      <div className="space-y-4">
        {report.modules.map((mod) => (
          <section key={mod.id} className="rounded-xl border border-slate-200 bg-white print:break-inside-avoid">
            <header className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
              {mod.note ? <p className="mt-0.5 text-xs text-slate-500">{mod.note}</p> : null}
            </header>
            <ul className="px-4 py-2">
              {mod.items.map((item, i) => (
                <ItemRow key={`${mod.id}-${i}`} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
