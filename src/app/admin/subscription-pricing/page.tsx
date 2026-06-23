import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getSubscriptionTiers } from "@/lib/subscription-tiers";
import { saveSubscriptionTier, deleteSubscriptionTier } from "@/app/actions/entities";
import SubscriptionTierForm from "@/components/admin/SubscriptionTierForm";

export const dynamic = "force-dynamic";

const money = (v: number | null) => (v == null ? "" : String(v));

export default async function SubscriptionPricingPage() {
  await requireRole("EDITOR");
  const tiers = await getSubscriptionTiers();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Subscription pricing</h1>
          <p className="text-sm text-slate-500">
            Frequency-based price tiers. The Subscription page auto-renders the tier that matches each journal&apos;s <b>Issues per year</b>.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">← Back to setup</Link>
      </div>

      {tiers.map((t) => (
        <section key={t.id} className="mb-8 rounded-xl border border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">{t.issuesPerYear} issues / year</h2>
            <form action={deleteSubscriptionTier}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="text-sm text-red-600 hover:text-red-700">Delete tier</button>
            </form>
          </div>
          <SubscriptionTierForm
            action={saveSubscriptionTier}
            submitLabel="Save tier"
            values={{
              issuesPerYear: String(t.issuesPerYear),
              printInr: money(t.printInr),
              singleIssueInr: money(t.singleIssueInr),
              onlineInr: money(t.onlineInr),
              printOnlineInr: money(t.printOnlineInr),
              printUsd: money(t.printUsd),
              onlineUsd: money(t.onlineUsd),
              printOnlineUsd: money(t.printOnlineUsd),
            }}
          />
        </section>
      ))}

      <section className="rounded-xl border border-dashed border-slate-300 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Add a tier</h2>
        <SubscriptionTierForm action={saveSubscriptionTier} submitLabel="Add tier" />
      </section>
    </main>
  );
}
