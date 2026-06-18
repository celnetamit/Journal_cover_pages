import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { adminEmails } from "@/lib/auth/google";
import AllowedDomainManager from "@/components/admin/AllowedDomainManager";

export const dynamic = "force-dynamic";

export default async function AuthDomainsPage() {
  await requireRole("ADMIN");
  const domains = await prisma.allowedDomain.findMany({ orderBy: { domain: "asc" } });

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sign-in domains</h1>
          <p className="text-sm text-slate-500">Email domains allowed to sign in with Google.</p>
        </div>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to setup
        </Link>
      </div>

      <AllowedDomainManager domains={domains.map((d) => ({ id: d.id, domain: d.domain }))} />

      <p className="mt-4 text-xs text-slate-500">
        Always-admin email{adminEmails().length > 1 ? "s" : ""}: {adminEmails().join(", ")}
      </p>
    </main>
  );
}
