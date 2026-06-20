import Link from "next/link";
import JournalDashboard from "@/components/JournalDashboard";
import { getDynamicBinderData } from "@/lib/formidable";
import { getJournals, targetJournalName } from "@/lib/journals";
import { requireSession, canEdit } from "@/lib/auth/session";
import { loadServerDrafts } from "@/lib/binder-store";
import { getJournalLegalData } from "@/lib/legal-data";
import { getManuscriptEngine } from "@/lib/manuscript-engine";
import { getAboutNotes } from "@/lib/about-notes";
import { prisma } from "@/lib/prisma";

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
  const [dynamicData, serverDrafts, profileRows, legalData, manuscriptEngine, aboutNotes] = await Promise.all([
    getDynamicBinderData(target),
    loadServerDrafts(),
    prisma.profile.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, designation: true, photoUrl: true },
    }),
    getJournalLegalData(),
    getManuscriptEngine(),
    getAboutNotes(),
  ]);

  const profiles = profileRows.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.designation ?? "",
    photo: p.photoUrl ?? "",
  }));

  return (
    <JournalDashboard
      journals={journals}
      defaultJournalId={target.id}
      dynamicData={dynamicData}
      serverDrafts={serverDrafts}
      canEdit={canEdit(session.role)}
      profiles={profiles}
      legalData={legalData}
      manuscriptEngine={manuscriptEngine}
      aboutNotes={aboutNotes}
    />
  );
}
