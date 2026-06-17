import { requireRole } from "@/lib/auth/session";
import { getCompanyOptions } from "@/lib/journal-options";
import { createPublisher } from "@/app/actions/entities";
import PublisherForm from "@/components/admin/PublisherForm";

export const dynamic = "force-dynamic";

export default async function NewPublisherPage() {
  await requireRole("EDITOR");
  const companies = await getCompanyOptions();
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New publisher</h1>
      <PublisherForm action={createPublisher} companies={companies} submitLabel="Create publisher" />
    </main>
  );
}
