import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EntityTable from "@/components/admin/EntityTable";
import { importCsv } from "@/app/actions/import-export";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const session = await requireRole("EDITOR");
  const domains = await prisma.domain.findMany({
    orderBy: { name: "asc" },
    include: { manager: { select: { name: true } }, _count: { select: { journals: true } } },
  });

  return (
    <EntityTable
      title="Domains"
      subtitle={`${domains.length} domains`}
      basePath="/admin/domains"
      entity="domain"
      columns={["Name", "Manager", "Journals"]}
      canDelete={isAdmin(session.role)}
      newLabel="New domain"
      exportEntity="domains"
      importAction={importCsv.bind(null, "domains", "/admin/domains")}
      rows={domains.map((d) => ({
        id: d.id,
        cells: [d.name, d.manager?.name ?? "—", d._count.journals],
        search: `${d.name} ${d.manager?.name ?? ""}`.toLowerCase(),
      }))}
    />
  );
}
