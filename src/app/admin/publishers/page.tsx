import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EntityTable from "@/components/admin/EntityTable";
import { importCsv } from "@/app/actions/import-export";

export const dynamic = "force-dynamic";

export default async function PublishersPage() {
  const session = await requireRole("EDITOR");
  const publishers = await prisma.publisher.findMany({
    orderBy: { name: "asc" },
    include: { company: { select: { name: true } }, _count: { select: { journals: true } } },
  });

  return (
    <EntityTable
      title="Publishers"
      subtitle={`${publishers.length} publishers`}
      basePath="/admin/publishers"
      entity="publisher"
      columns={["Name", "Company", "Journals"]}
      canDelete={isAdmin(session.role)}
      newLabel="New publisher"
      exportEntity="publishers"
      importAction={importCsv.bind(null, "publishers", "/admin/publishers")}
      rows={publishers.map((p) => ({
        id: p.id,
        cells: [p.name, p.company?.name ?? "—", p._count.journals],
        search: `${p.name} ${p.company?.name ?? ""}`.toLowerCase(),
      }))}
    />
  );
}
