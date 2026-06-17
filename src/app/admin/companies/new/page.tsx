import { requireRole } from "@/lib/auth/session";
import { getProfileOptions } from "@/lib/journal-options";
import { createCompany } from "@/app/actions/entities";
import CompanyForm from "@/components/admin/CompanyForm";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  await requireRole("EDITOR");
  const profiles = await getProfileOptions();
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New company</h1>
      <CompanyForm action={createCompany} profiles={profiles} submitLabel="Create company" />
    </main>
  );
}
