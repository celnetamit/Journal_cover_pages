import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCompanyOptions } from "@/lib/journal-options";
import { updatePublisher } from "@/app/actions/entities";
import PublisherForm from "@/components/admin/PublisherForm";

export const dynamic = "force-dynamic";

export default async function EditPublisherPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EDITOR");
  const { id } = await params;
  const [pub, companies] = await Promise.all([prisma.publisher.findUnique({ where: { id } }), getCompanyOptions()]);
  if (!pub) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit publisher</h1>
      <PublisherForm
        action={updatePublisher.bind(null, id)}
        values={{ name: pub.name, logoUrl: pub.logoUrl ?? "", companyId: pub.companyId ?? "", about: pub.about ?? "", salientFeatures: pub.salientFeatures.join("\n"), objectives: pub.objectives.join("\n"), aboutNotes: pub.aboutNotes.join("\n"), email: pub.email ?? "", phone: pub.phone ?? "", website: pub.website ?? "" }}
        companies={companies}
        submitLabel="Save changes"
      />
    </main>
  );
}
