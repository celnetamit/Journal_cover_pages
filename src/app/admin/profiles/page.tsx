import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EntityTable from "@/components/admin/EntityTable";
import { importCsv } from "@/app/actions/import-export";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const session = await requireRole("EDITOR");
  const profiles = await prisma.profile.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <EntityTable
      title="Profiles"
      subtitle={`${profiles.length} people`}
      basePath="/admin/profiles"
      entity="profile"
      columns={["Name", "Email", "Designation", "Journals"]}
      canDelete={isAdmin(session.role)}
      newLabel="New profile"
      exportEntity="profiles"
      importAction={importCsv.bind(null, "profiles", "/admin/profiles")}
      rows={profiles.map((p) => ({
        id: p.id,
        cells: [p.name, p.email ?? "—", p.designation ?? "—", p._count.memberships],
        search: `${p.name} ${p.email ?? ""} ${p.designation ?? ""}`.toLowerCase(),
      }))}
    />
  );
}
