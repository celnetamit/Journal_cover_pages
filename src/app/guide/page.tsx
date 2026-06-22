import Link from "next/link";
import { GUIDE_STEPS } from "@/lib/guide-steps";
import { PageHeader, H2, P, Callout, UI } from "@/components/guide/parts";

export const metadata = { title: "Guide · Overview" };

const SECTIONS = [
  ["Cover Spread", "Front and back cover artwork, title, volume, issue, month range, year and logos."],
  ["Title Page", "Publisher imprint: printed-by, address, phone, email, registered office and CIN."],
  ["Subscription", "Subscription prices plus bank and legal details (auto-generated, or overridden)."],
  ["About", "The journal description and its focus & scope."],
  ["Management", "Publication management heads, officers and contact boxes."],
  ["Manuscript", "Manuscript submission notice and QR code."],
  ["Editorial", "The editorial board: editors-in-chief, editors and associates."],
  ["Director", "The Director's Desk letter, signature and photo."],
  ["Contents", "The table of contents for the issue's articles."],
];

export default function GuideOverviewPage() {
  const steps = GUIDE_STEPS.filter((s) => s.num > 0);
  return (
    <article>
      <PageHeader
        title="Journal Builder — User Guide"
        lead="This guide walks you through the whole platform, from first sign-in to a print-ready binder. Follow the steps in order the first time; afterwards use the sidebar to jump to any part."
      />

      <H2>Watch the 3-minute tour</H2>
      <P>The fastest way to get oriented is the narrated walkthrough. It covers the same ground as this guide.</P>
      <video
        controls
        preload="metadata"
        className="w-full rounded-xl border border-slate-200 shadow-sm"
        src="/training/journal-builder-training.mp4"
      >
        Your browser does not support embedded video.
      </video>

      <H2>What this platform does</H2>
      <P>
        Journal Builder creates the <strong>initial pages of a journal issue</strong> — the cover spread, title page,
        editorial board, director&apos;s letter, table of contents and more — and exports them as print-ready PDFs (the
        &ldquo;binder&rdquo;). Most content is pulled from shared records you set up once, so every issue stays consistent
        and you only re-enter what changes.
      </P>

      <H2>The four steps</H2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {steps.map((s) => (
          <Link
            key={s.slug}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {s.num}</span>
            <span className="mt-1 block font-medium text-slate-900">{s.title}</span>
            <p className="mt-1 text-sm text-slate-500">{s.summary}</p>
          </Link>
        ))}
      </div>

      <H2>The nine sections of every issue</H2>
      <P>
        Each issue is built from nine sections, shown as tabs along the top of the editor. You&apos;ll meet them in detail in{" "}
        <Link href="/guide/build" className="font-medium text-slate-900 underline">
          Step 3
        </Link>
        ; here&apos;s the quick reference:
      </P>
      <ol className="my-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SECTIONS.map(([name, desc], i) => (
          <li key={name} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {i + 1}
            </span>
            <span className="text-sm">
              <span className="font-medium text-slate-900">{name}</span>
              <span className="block text-slate-500">{desc}</span>
            </span>
          </li>
        ))}
      </ol>

      <Callout type="note" title="Roles">
        What you can do depends on your role. <UI>Viewer</UI> can browse and read; <UI>Editor</UI> can build issues and
        edit shared data; <UI>Admin</UI> can additionally manage users and sign-in domains. If a button is missing or a
        page sends you home, you likely don&apos;t have the role for it — ask your administrator.
      </Callout>

      <div className="mt-10">
        <Link
          href="/guide/setup"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Start with Step 1: Set up shared data →
        </Link>
      </div>
    </article>
  );
}
