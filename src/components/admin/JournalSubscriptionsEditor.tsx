import Link from "next/link";
import { setJournalSubscriptions } from "@/app/actions/journal-subscriptions";

const MODE_LABEL: Record<string, string> = { PRINT: "Print", ONLINE: "Online", PRINT_ONLINE: "Print + Online" };

export type PlanRow = {
  id: string;
  name: string;
  mode: string;
  globalUsd: number | null;
  globalInr: number | null;
  overrideUsd: number | null;
  overrideInr: number | null;
  hidden: boolean;
};

const control =
  "w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

// Server component: per-journal subscription price overrides. Leave a field
// blank to fall back to the plan's global price.
export default function JournalSubscriptionsEditor({
  journalId,
  plans,
}: {
  journalId: string;
  plans: PlanRow[];
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Subscription pricing</h2>
        <p className="text-sm text-slate-500">
          Override the global plan price for this journal. Blank = use the global price.
          Untick <b>Show</b> to hide a plan from this journal&apos;s subscription page.{" "}
          <Link href="/admin/subscriptions" className="text-slate-700 underline">Manage plans</Link>
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-slate-400">No subscription plans yet.</p>
      ) : (
        <form action={setJournalSubscriptions.bind(null, journalId)}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Show</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Mode</th>
                  <th className="px-4 py-2">USD (override)</th>
                  <th className="px-4 py-2">INR (override)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <input
                        name={`show_${p.id}`}
                        type="checkbox"
                        defaultChecked={!p.hidden}
                        aria-label={`Show ${p.name} on the subscription page`}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{MODE_LABEL[p.mode] ?? p.mode}</td>
                    <td className="px-4 py-3">
                      <input
                        name={`usd_${p.id}`}
                        type="number"
                        step="0.01"
                        defaultValue={p.overrideUsd ?? ""}
                        placeholder={p.globalUsd != null ? String(p.globalUsd) : "—"}
                        className={control}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`inr_${p.id}`}
                        type="number"
                        step="0.01"
                        defaultValue={p.overrideInr ?? ""}
                        placeholder={p.globalInr != null ? String(p.globalInr) : "—"}
                        className={control}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save pricing
          </button>
        </form>
      )}
    </section>
  );
}
