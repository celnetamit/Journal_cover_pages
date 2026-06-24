import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getProfileOptions } from "@/lib/journal-options";
import { updateCompany } from "@/app/actions/entities";
import CompanyForm from "@/components/admin/CompanyForm";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EDITOR");
  const { id } = await params;
  const [c, profiles] = await Promise.all([prisma.company.findUnique({ where: { id } }), getProfileOptions()]);
  if (!c) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit company</h1>
      <CompanyForm
        action={updateCompany.bind(null, id)}
        values={{
          name: c.name,
          email: c.email ?? "",
          phone: c.phone ?? "",
          website: c.website ?? "",
          logoUrl: c.logoUrl ?? "",
          sealUrl: c.sealUrl ?? "",
          registeredAddress: c.registeredAddress ?? "",
          salesAddress: c.salesAddress ?? "",
          cin: c.cin ?? "",
          gst: c.gst ?? "",
          bankAccountName: c.bankAccountName ?? "",
          bankAccountNo: c.bankAccountNo ?? "",
          bankIfsc: c.bankIfsc ?? "",
          bankName: c.bankName ?? "",
          bankBranch: c.bankBranch ?? "",
          bankSwift: c.bankSwift ?? "",
          directorId: c.directorId ?? "",
          printedBy: c.printedBy ?? "",
          dispatchContactName: c.dispatchContactName ?? "",
          dispatchContactPhone: c.dispatchContactPhone ?? "",
          dispatchContactEmail: c.dispatchContactEmail ?? "",
          salesContactName: c.salesContactName ?? "",
          salesContactPhone: c.salesContactPhone ?? "",
          salesContactEmail: c.salesContactEmail ?? "",
        }}
        profiles={profiles}
        submitLabel="Save changes"
      />
    </main>
  );
}
