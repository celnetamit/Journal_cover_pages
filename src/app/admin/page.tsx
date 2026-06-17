import Link from "next/link";
import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHubPage() {
  const session = await requireRole("EDITOR");
  const [profiles, companies, publishers, domains, subscriptions, journals, users] = await Promise.all([
    prisma.profile.count(),
    prisma.company.count(),
    prisma.publisher.count(),
    prisma.domain.count(),
    prisma.subscription.count(),
    prisma.journal.count(),
    prisma.user.count(),
  ]);

  const cards = [
    { href: "/journals", title: "Journals", count: journals, desc: "Journal catalog + cover content" },
    { href: "/admin/profiles", title: "Profiles", count: profiles, desc: "People: editors, directors, board & team" },
    { href: "/admin/companies", title: "Companies", count: companies, desc: "Legal entity, bank & registered details" },
    { href: "/admin/publishers", title: "Publishers", count: publishers, desc: "Publisher → company" },
    { href: "/admin/domains", title: "Domains", count: domains, desc: "Subject domains + manager" },
    { href: "/admin/subscriptions", title: "Subscriptions", count: subscriptions, desc: "Global plans + prices" },
    ...(isAdmin(session.role) ? [{ href: "/admin/users", title: "Users", count: users, desc: "Login accounts & roles" }] : []),
  ];

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Setup</h1>
      <p className="mb-6 text-sm text-slate-500">Manage the data that feeds journal binders.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">{c.title}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c.count}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
