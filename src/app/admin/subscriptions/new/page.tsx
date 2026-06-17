import { requireRole } from "@/lib/auth/session";
import { createSubscription } from "@/app/actions/entities";
import SubscriptionForm from "@/components/admin/SubscriptionForm";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  await requireRole("EDITOR");
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">New plan</h1>
      <SubscriptionForm action={createSubscription} submitLabel="Create plan" />
    </main>
  );
}
