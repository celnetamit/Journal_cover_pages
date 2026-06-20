import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAboutNotes } from "@/lib/about-notes";
import { saveAboutNotes } from "@/app/actions/entities";
import AboutNotesForm from "@/components/admin/AboutNotesForm";

export const dynamic = "force-dynamic";

export default async function AboutNotesPage() {
  await requireRole("EDITOR");
  const paragraphs = await getAboutNotes();

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">About notes</h1>
          <p className="text-sm text-slate-500">Shared closing paragraphs for the About page of every journal.</p>
        </div>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to setup
        </Link>
      </div>
      <AboutNotesForm
        action={saveAboutNotes}
        values={{ paragraphs: paragraphs.join("\n") }}
        submitLabel="Save"
      />
    </main>
  );
}
