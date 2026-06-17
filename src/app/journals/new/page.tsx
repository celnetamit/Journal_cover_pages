import { requireRole } from "@/lib/auth/session";
import { getJournalFormOptions } from "@/lib/journal-options";
import { createJournal } from "@/app/actions/journals";
import JournalForm from "@/components/JournalForm";

export const dynamic = "force-dynamic";

export default async function NewJournalPage() {
  await requireRole("EDITOR");
  const options = await getJournalFormOptions();

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New journal</h1>
      <JournalForm action={createJournal} options={options} submitLabel="Create journal" />
    </main>
  );
}
