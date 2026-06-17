import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EntityTable from "@/components/admin/EntityTable";

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
      rows={domains.map((d) => ({ id: d.id, cells: [d.name, d.manager?.name ?? "—", d._count.journals] }))}
    />
  );
}
