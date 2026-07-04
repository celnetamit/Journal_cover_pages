import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Most recent activity is enough for an at-a-glance audit; older rows stay in the DB.
const LIMIT = 200;

const ACTION_LABEL: Record<string, string> = {
  "journal.create": "Created",
  "journal.update": "Updated",
  "journal.delete": "Deleted",
};

export default async function AdminLogsPage() {
  await requireRole("ADMIN");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: LIMIT,
  });

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Activity log</h1>
          <p className="text-sm text-slate-500">Recent journal changes, newest first (last {LIMIT}).</p>
        </div>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          ← Setup
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Who</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Journal</th>
              <th className="px-4 py-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{log.actorName || "—"}</div>
                  <div className="text-slate-500">{log.actorEmail}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{ACTION_LABEL[log.action] ?? log.action}</td>
                <td className="px-4 py-3 text-slate-700">{log.targetName ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{log.summary ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
