"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type QaJournalRow = {
  id: string;
  name: string;
  abbreviation: string;
  issue: string | null;
  hasSaved: boolean;
  reviewStatus: "DRAFT" | "IN_INTERNAL_REVIEW" | null;
  lastRun: { passed: boolean; failCount: number | null } | null;
};

// Live-searchable table of journals for the Binder QA hub. Mirrors the audit
// hub's table; rows link to the journal's QA workspace.
export default function QaJournalTable({ rows }: { rows: QaJournalRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.abbreviation.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div>
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by journal name or abbreviation…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-500"
          autoFocus
        />
      </div>
      <p className="mb-2 text-xs text-slate-500">
        {filtered.length} of {rows.length} journal{rows.length === 1 ? "" : "s"}
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5">Journal</th>
              <th className="px-4 py-2.5 w-32">Abbreviation</th>
              <th className="px-4 py-2.5 w-48">Issue</th>
              <th className="px-4 py-2.5 w-40">AI QA</th>
              <th className="px-4 py-2.5 w-44">Workflow</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No journals match “{query}”.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/qa/${r.id}`)}
                  className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{r.abbreviation}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{r.hasSaved ? r.issue || "Saved issue" : "No saved issue"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {!r.lastRun ? (
                      <span className="text-slate-400">Not run</span>
                    ) : r.lastRun.passed ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
                        {r.lastRun.failCount != null ? `${r.lastRun.failCount} fail(s)` : "Failed"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {r.reviewStatus === "IN_INTERNAL_REVIEW" ? (
                      <span className="rounded bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 ring-1 ring-inset ring-sky-600/20">In internal review</span>
                    ) : (
                      <span className="text-slate-400">Draft</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
