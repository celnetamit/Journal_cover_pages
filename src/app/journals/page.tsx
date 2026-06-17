import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { deleteJournal } from "@/app/actions/journals";
import { importCsv } from "@/app/actions/import-export";
import EntityTable from "@/components/admin/EntityTable";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const session = await requireRole("EDITOR");
  const journals = await prisma.journal.findMany({
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
      newLabel="New journal"
      deleteAction={deleteJournal}
      exportEntity="journals"
      importAction={importCsv.bind(null, "journals", "/journals")}
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
