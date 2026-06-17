import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EntityTable from "@/components/admin/EntityTable";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const session = await requireRole("EDITOR");
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { director: { select: { name: true } }, _count: { select: { publishers: true } } },
  });

  return (
    <EntityTable
      title="Companies"
      subtitle={`${companies.length} companies`}
      basePath="/admin/companies"
      entity="company"
      columns={["Name", "Director", "CIN", "Publishers"]}
      canDelete={isAdmin(session.role)}
      newLabel="New company"
      rows={companies.map((c) => ({
        id: c.id,
        cells: [c.name, c.director?.name ?? "—", c.cin ?? "—", c._count.publishers],
      }))}
    />
  );
}
