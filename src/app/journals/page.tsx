import Link from "next/link";
import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteJournal } from "@/app/actions/journals";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const session = await requireRole("EDITOR");
  const admin = isAdmin(session.role);
  const journals = await prisma.journal.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      domain: { select: { name: true } },
      publisher: { select: { name: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Journals</h1>
          <p className="text-sm text-slate-500">{journals.length} journals</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Builder
          </Link>
          <Link
            href="/journals/new"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New journal
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Journal</th>
              <th className="px-4 py-2">Domain</th>
              <th className="px-4 py-2">Publisher</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {journals.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{j.name}</div>
                  <div className="text-slate-500">{j.abbreviation}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{j.domain?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{j.publisher?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/journals/${j.id}/edit`} className="text-slate-600 hover:text-slate-900">
                      Edit
                    </Link>
                    {admin && (
                      <form action={deleteJournal}>
                        <input type="hidden" name="id" value={j.id} />
                        <button type="submit" className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
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
