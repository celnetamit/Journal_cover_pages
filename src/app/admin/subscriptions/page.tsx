import { requireRole, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EntityTable from "@/components/admin/EntityTable";
import { importCsv } from "@/app/actions/import-export";

export const dynamic = "force-dynamic";

const MODE_LABEL: Record<string, string> = { PRINT: "Print", ONLINE: "Online", PRINT_ONLINE: "Print + Online" };

export default async function SubscriptionsPage() {
  const session = await requireRole("EDITOR");
  const plans = await prisma.subscription.findMany({ orderBy: { name: "asc" } });

  return (
    <EntityTable
      title="Subscriptions"
      subtitle={`${plans.length} plans`}
      basePath="/admin/subscriptions"
      entity="subscription"
      columns={["Name", "Mode", "USD", "INR"]}
      canDelete={isAdmin(session.role)}
      newLabel="New plan"
      exportEntity="subscriptions"
      importAction={importCsv.bind(null, "subscriptions", "/admin/subscriptions")}
      rows={plans.map((p) => ({
        id: p.id,
        cells: [p.name, MODE_LABEL[p.mode] ?? p.mode, p.priceUsd ?? "—", p.priceInr ?? "—"],
        search: `${p.name} ${p.mode}`.toLowerCase(),
      }))}
    />
  );
}
