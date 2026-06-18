import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getManuscriptEngine } from "@/lib/manuscript-engine";
import { saveManuscriptEngine } from "@/app/actions/entities";
import ManuscriptEngineForm from "@/components/admin/ManuscriptEngineForm";

export const dynamic = "force-dynamic";

export default async function ManuscriptEnginePage() {
  await requireRole("EDITOR");
  const settings = await getManuscriptEngine();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Manuscript engine</h1>
          <p className="text-sm text-slate-500">Shared content for the Manuscript page of every journal.</p>
        </div>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to setup
        </Link>
      </div>
      <ManuscriptEngineForm
        action={saveManuscriptEngine}
        values={{
          heading: settings.heading,
          leadText: settings.leadText,
          steps: settings.steps.join("\n"),
          scanLabel: settings.scanLabel,
          logoUrl: settings.logoUrl,
        }}
        submitLabel="Save"
      />
    </main>
  );
}
