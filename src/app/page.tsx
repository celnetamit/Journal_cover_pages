import Link from "next/link";
import JournalDashboard from "@/components/JournalDashboard";
import { getDynamicBinderData } from "@/lib/formidable";
import { getJournals, targetJournalName } from "@/lib/journals";
import { requireSession, canEdit } from "@/lib/auth/session";
import { loadServerDrafts } from "@/lib/binder-store";

export default async function Home() {
  const session = await requireSession();
  const journals = await getJournals();

  if (journals.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">No journals yet</h1>
        <p className="mt-2 text-sm text-slate-500">Add a journal to start building binder pages.</p>
        <Link
          href="/journals/new"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New journal
        </Link>
      </main>
    );
  }

  const target = journals.find((journal) => journal.name === targetJournalName) ?? journals[0];
  const [dynamicData, serverDrafts] = await Promise.all([
    getDynamicBinderData(target),
    loadServerDrafts(),
  ]);

  return (
    <JournalDashboard
      journals={journals}
      defaultJournalId={target.id}
      dynamicData={dynamicData}
      serverDrafts={serverDrafts}
      canEdit={canEdit(session.role)}
    />
  );
}
