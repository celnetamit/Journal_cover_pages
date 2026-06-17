import Link from "next/link";
import type { ReactNode } from "react";
import { deleteEntity } from "@/app/actions/entities";

export type Row = { id: string; cells: ReactNode[] };

// Generic admin list: header + "New" button + table with Edit/Delete per row.
// `entity` is the deleteEntity discriminator (e.g. "domain"); delete is shown
// only when `canDelete` (admin).
export default function EntityTable({
  title,
  subtitle,
  basePath,
  entity,
  columns,
  rows,
  canDelete,
  newLabel = "New",
}: {
  title: string;
  subtitle?: string;
  basePath: string;
  entity: string;
  columns: string[];
  rows: Row[];
  canDelete: boolean;
  newLabel?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">← Setup</Link>
          <Link href={`${basePath}/new`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
            {newLabel}
          </Link>
        </div>
      </div>

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
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Nothing here yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`${basePath}/${row.id}/edit`} className="text-slate-600 hover:text-slate-900">Edit</Link>
                    {canDelete && (
                      <form action={deleteEntity}>
                        <input type="hidden" name="entity" value={entity} />
                        <input type="hidden" name="id" value={row.id} />
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
    </main>
  );
}
