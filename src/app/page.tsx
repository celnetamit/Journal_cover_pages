import Link from "next/link";
import JournalDashboard from "@/components/JournalDashboard";
import { getDynamicBinderData } from "@/lib/formidable";
import { getJournals, targetJournalName } from "@/lib/journals";
import { requireSession, canEdit, canEditBinders } from "@/lib/auth/session";
import { assignedJournalIds } from "@/lib/journal-access";
import { loadServerDrafts } from "@/lib/binder-store";
import { getJournalLegalData } from "@/lib/legal-data";
import { getManuscriptEngine } from "@/lib/manuscript-engine";
import { getSubscriptionTiers } from "@/lib/subscription-tiers";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await requireSession();
  const isManager = session.role === "JOURNAL_MANAGER";
  const allJournals = await getJournals();
  // Journal managers see only their assigned journals; everyone else is unaffected.
  const journals = isManager
    ? await (async () => {
        const allowed = await assignedJournalIds(session);
        return allowed === "ALL" ? allJournals : allJournals.filter((j) => allowed.has(j.id));
      })()
    : allJournals;

  if (journals.length === 0) {
    if (isManager) {
      return (
        <main className="mx-auto w-full max-w-2xl p-10 text-center">
          <h1 className="text-lg font-semibold text-slate-900">No journals assigned to you yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            An administrator needs to assign one or more journals to your account before you can
            build binder pages.
          </p>
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-2xl p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">No journals yet</h1>
        <p className="mt-2 text-sm text-slate-500">Add a journal to start building binder pages.</p>
        {canEdit(session.role) && (
          <Link
            href="/journals/new"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New journal
          </Link>
        )}
      </main>
    );
  }

  const target = journals.find((journal) => journal.name === targetJournalName) ?? journals[0];
  const [dynamicData, serverDrafts, profileRows, legalData, manuscriptEngine, subscriptionTiers] = await Promise.all([
    getDynamicBinderData(target),
    loadServerDrafts(),
    prisma.profile.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, designation: true, photoUrl: true },
    }),
    getJournalLegalData(),
    getManuscriptEngine(),
    getSubscriptionTiers(),
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
      canEdit={canEditBinders(session.role)}
      profiles={profiles}
      currentUser={{ name: session.name, email: session.email }}
      legalData={legalData}
      manuscriptEngine={manuscriptEngine}
      subscriptionTiers={subscriptionTiers}
    />
  );
}
