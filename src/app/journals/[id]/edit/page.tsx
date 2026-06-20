import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getJournalFormOptions } from "@/lib/journal-options";
import { updateJournal } from "@/app/actions/journals";
import JournalForm, { type JournalFormValues } from "@/components/JournalForm";
import JournalBoardEditor from "@/components/admin/JournalBoardEditor";
import JournalSubscriptionsEditor from "@/components/admin/JournalSubscriptionsEditor";

export const dynamic = "force-dynamic";

export default async function EditJournalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EDITOR");
  const { id } = await params;

  const [journal, options, members, plans, overrides] = await Promise.all([
    prisma.journal.findUnique({ where: { id } }),
    getJournalFormOptions(),
    prisma.journalMember.findMany({
      where: { journalId: id },
      orderBy: [{ role: "asc" }, { order: "asc" }],
      include: { profile: { select: { name: true } } },
    }),
    prisma.subscription.findMany({ orderBy: { name: "asc" } }),
    prisma.journalSubscription.findMany({ where: { journalId: id } }),
  ]);
  if (!journal) notFound();

  const overrideByPlan = new Map(overrides.map((o) => [o.subscriptionId, o]));
  const planRows = plans.map((p) => ({
    id: p.id,
    name: p.name,
    mode: p.mode,
    globalUsd: p.priceUsd,
    globalInr: p.priceInr,
    overrideUsd: overrideByPlan.get(p.id)?.priceUsd ?? null,
    overrideInr: overrideByPlan.get(p.id)?.priceInr ?? null,
    hidden: journal.hiddenSubscriptionIds.includes(p.id),
  }));

  const values: JournalFormValues = {
    name: journal.name,
    abbreviation: journal.abbreviation,
    slug: journal.slug,
    shortName: journal.shortName ?? "",
    website: journal.website ?? "",
    issnOnline: journal.issnOnline ?? "",
    issnPrint: journal.issnPrint ?? "",
    sjif: journal.sjif ?? "",
    icv: journal.icv ?? "",
    doi: journal.doi ?? "",
    impactFactor: journal.impactFactor ?? "",
    about: journal.about ?? "",
    manuscriptUrl: journal.manuscriptUrl ?? "",
    manuscriptNotice: journal.manuscriptNotice ?? "",
    directorDeskTitle: journal.directorDeskTitle ?? "",
    directorDeskParagraphs: journal.directorDeskParagraphs.join("\n"),
    frequency: journal.frequency,
    frequencyLabel: journal.frequencyLabel ?? "",
    issuesPerYear: journal.issuesPerYear != null ? String(journal.issuesPerYear) : "",
    typeOfPublication: journal.typeOfPublication ?? "",
    access: journal.access ?? "",
    language: journal.language ?? "",
    coverFrontUrl: journal.coverFrontUrl ?? "",
    coverBackUrl: journal.coverBackUrl ?? "",
    logoUrl: journal.logoUrl ?? "",
    domainId: journal.domainId ?? "",
    publisherId: journal.publisherId ?? "",
    managerId: journal.managerId ?? "",
    focusScope: journal.focusScope.join("\n"),
    objectives: journal.objectives.join("\n"),
    salientFeatures: journal.salientFeatures.join("\n"),
    keywords: journal.keywords.join(", "),
    indexing: journal.indexing.join(", "),
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit journal</h1>
      <JournalForm
        action={updateJournal.bind(null, id)}
        values={values}
        options={options}
        submitLabel="Save changes"
      />
      <JournalBoardEditor
        journalId={id}
        profiles={options.profiles}
        members={members.map((m) => ({ id: m.id, role: m.role, order: m.order, profileName: m.profile.name }))}
      />
      <JournalSubscriptionsEditor journalId={id} plans={planRows} />
    </main>
  );
}
