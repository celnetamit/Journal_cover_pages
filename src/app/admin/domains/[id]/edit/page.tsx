import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProfileOptions } from "@/lib/journal-options";
import { updateDomain } from "@/app/actions/entities";
import DomainForm from "@/components/admin/DomainForm";

export const dynamic = "force-dynamic";

export default async function EditDomainPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EDITOR");
  const { id } = await params;
  const [domain, profiles] = await Promise.all([prisma.domain.findUnique({ where: { id } }), getProfileOptions()]);
  if (!domain) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit domain</h1>
      <DomainForm
        action={updateDomain.bind(null, id)}
        values={{ name: domain.name, logoUrl: domain.logoUrl ?? "", managerId: domain.managerId ?? "" }}
        profiles={profiles}
        submitLabel="Save changes"
      />
    </main>
  );
}
