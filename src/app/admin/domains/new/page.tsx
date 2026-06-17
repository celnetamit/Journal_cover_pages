import { requireRole } from "@/lib/auth/session";
import { getProfileOptions } from "@/lib/journal-options";
import { createDomain } from "@/app/actions/entities";
import DomainForm from "@/components/admin/DomainForm";

export const dynamic = "force-dynamic";

export default async function NewDomainPage() {
  await requireRole("EDITOR");
  const profiles = await getProfileOptions();
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New domain</h1>
      <DomainForm action={createDomain} profiles={profiles} submitLabel="Create domain" />
    </main>
  );
}
