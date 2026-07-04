import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import UserManager from "@/components/UserManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireRole("ADMIN");
  const [users, journals] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        managedJournals: { select: { id: true } },
      },
    }),
    prisma.journal.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage who can sign in and what they can do.</p>
        </div>
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to app
        </Link>
      </div>
      <UserManager
        currentUserId={session.userId}
        journals={journals}
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          managedJournalIds: u.managedJournals.map((j) => j.id),
        }))}
      />
    </main>
  );
}
