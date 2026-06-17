import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { updateSubscription } from "@/app/actions/entities";
import SubscriptionForm from "@/components/admin/SubscriptionForm";

export const dynamic = "force-dynamic";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("EDITOR");
  const { id } = await params;
  const plan = await prisma.subscription.findUnique({ where: { id } });
  if (!plan) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Edit plan</h1>
      <SubscriptionForm
        action={updateSubscription.bind(null, id)}
        values={{
          name: plan.name,
          mode: plan.mode,
          priceUsd: plan.priceUsd != null ? String(plan.priceUsd) : "",
          priceInr: plan.priceInr != null ? String(plan.priceInr) : "",
        }}
        submitLabel="Save changes"
      />
    </main>
  );
}
