import { redirect } from "next/navigation";
import { requireSession, isAdmin, canEdit } from "@/lib/auth/session";
import { assignedJournalIds } from "@/lib/journal-access";
import { prisma } from "@/lib/prisma";
import { deleteJournal } from "@/app/actions/journals";
import { importCsv } from "@/app/actions/import-export";
import EntityTable from "@/components/admin/EntityTable";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const session = await requireSession();
  // Viewers have no journal-edit surface (previously gated by requireRole("EDITOR")).
  if (!canEdit(session.role) && session.role !== "JOURNAL_MANAGER") redirect("/");
  const isManager = session.role === "JOURNAL_MANAGER";
  const allowed = await assignedJournalIds(session);

  const journals = await prisma.journal.findMany({
    // Managers see only their assigned journals; editors/admins see all.
    where: allowed === "ALL" ? undefined : { id: { in: [...allowed] } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      shortName: true,
      domain: { select: { name: true } },
      publisher: { select: { name: true } },
    },
  });

  return (
    <EntityTable
      title="Journals"
      subtitle={`${journals.length} journals`}
      basePath="/journals"
      entity="journal"
      backHref="/"
      backLabel="← Builder"
      columns={["Journal", "Domain", "Publisher"]}
      canDelete={isAdmin(session.role)}
      canCreate={!isManager}
      newLabel="New journal"
      deleteAction={deleteJournal}
      exportEntity={isManager ? undefined : "journals"}
      importAction={isManager ? undefined : importCsv.bind(null, "journals", "/journals")}
      rows={journals.map((j) => ({
        id: j.id,
        cells: [
          <div key="name">
            <div className="font-medium text-slate-900">{j.name}</div>
            <div className="text-slate-500">{j.abbreviation}</div>
          </div>,
          j.domain?.name ?? "—",
          j.publisher?.name ?? "—",
        ],
        search: `${j.name} ${j.abbreviation} ${j.shortName ?? ""} ${j.domain?.name ?? ""} ${j.publisher?.name ?? ""}`.toLowerCase(),
      }))}
    />
  );
}
