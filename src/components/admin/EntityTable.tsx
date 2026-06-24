"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { deleteEntity } from "@/app/actions/entities";
import type { ImportState } from "@/app/actions/import-export";

export type Row = { id: string; cells: ReactNode[]; search: string };

const control =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export default function EntityTable({
  title,
  subtitle,
  basePath,
  entity,
  columns,
  rows,
  canDelete,
  newLabel = "New",
  deleteAction = deleteEntity,
  exportEntity,
  importAction,
  backHref = "/admin",
  backLabel = "← Setup",
}: {
  title: string;
  subtitle?: string;
  basePath: string;
  entity: string;
  columns: string[];
  rows: Row[];
  canDelete: boolean;
  newLabel?: string;
  deleteAction?: (formData: FormData) => Promise<void>;
  // When set, shows the CSV export link (/api/export/{exportEntity}) + import form.
  exportEntity?: string;
  importAction?: (prev: ImportState, formData: FormData) => Promise<ImportState>;
  backHref?: string;
  backLabel?: string;
}) {
  const [query, setQuery] = useState("");
  // deleteEntity reads {entity, id}; deleteJournal reads {id} and ignores entity.
  const hidden = (id: string) => ({ entity, id });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.search.includes(q)) : rows;
  }, [query, rows]);

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={backHref} className="text-sm text-slate-600 hover:text-slate-900">{backLabel}</Link>
          {exportEntity && (
            <a
              href={`/api/export/${exportEntity}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </a>
          )}
          <Link href={`${basePath}/new`} data-tour="new-entity-btn" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            {newLabel}
          </Link>
        </div>
      </div>

      {importAction && <ImportForm action={importAction} />}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${title.toLowerCase()}…`}
        className={`${control} mb-3 w-full`}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-2">{c}</th>
              ))}
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  {rows.length === 0 ? "Nothing here yet." : "No matches."}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`${basePath}/${row.id}/edit`} className="text-slate-600 hover:text-slate-900">Edit</Link>
                    {canDelete && (
                      <form action={deleteAction}>
                        {Object.entries(hidden(row.id)).map(([k, v]) => (
                          <input key={k} type="hidden" name={k} value={v} />
                        ))}
                        <button type="submit" className="text-red-600 hover:text-red-700">Delete</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {query && (
        <p className="mt-2 text-xs text-slate-400">{filtered.length} of {rows.length} shown</p>
      )}
    </main>
  );
}

function ImportForm({ action }: { action: (prev: ImportState, formData: FormData) => Promise<ImportState> }) {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(action, undefined);
  return (
    <form action={formAction} className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className="text-sm font-medium text-slate-700">Import CSV (upsert):</span>
      <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
        {pending ? "Importing…" : "Import"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-emerald-700">{state.message}</span>}
    </form>
  );
}
