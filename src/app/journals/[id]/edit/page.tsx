import { notFound } from "next/navigation";
import { canEdit } from "@/lib/auth/session";
import { requireJournalManageAccess } from "@/lib/journal-access";
import { prisma } from "@/lib/prisma";
import { getJournalFormOptions } from "@/lib/journal-options";
import { updateJournal } from "@/app/actions/journals";
import JournalForm, { type JournalFormValues } from "@/components/JournalForm";
import JournalBoardEditor from "@/components/admin/JournalBoardEditor";

export const dynamic = "force-dynamic";

export default async function EditJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Admits editors/admins for any journal, a manager only for an assigned one.
  const session = await requireJournalManageAccess(id);
  // Board-member editing runs under requireRole("EDITOR") actions, so managers
  // (who can't reach those) only get the journal-record form.
  const showBoardEditor = canEdit(session.role);

  const [journal, options, members] = await Promise.all([
    prisma.journal.findUnique({ where: { id } }),
    getJournalFormOptions(),
    prisma.journalMember.findMany({
      where: { journalId: id },
      orderBy: [{ role: "asc" }, { order: "asc" }],
      include: { profile: { select: { name: true } } },
    }),
  ]);
  if (!journal) notFound();

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
    manuscriptUrl: journal.manuscriptUrl ?? "",
    editorialBoardUrl: journal.editorialBoardUrl ?? "",
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
    domainId: journal.domainId ?? "",
    publisherId: journal.publisherId ?? "",
    managerId: journal.managerId ?? "",
    focusScope: journal.focusScope.join("\n"),
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
      {showBoardEditor && (
        <JournalBoardEditor
          journalId={id}
          profiles={options.profiles}
          members={members.map((m) => ({ id: m.id, role: m.role, order: m.order, profileName: m.profile.name }))}
        />
      )}
    </main>
  );
}
