import Link from "next/link";
import { PageHeader, H2, P, Callout, Figure, Steps, Step, UI, PrevNext } from "@/components/guide/parts";

export const metadata = { title: "Guide · Preview & print the binder" };

export default function GuidePrintPage() {
  return (
    <article>
      <PageHeader
        num={4}
        title="Preview & print the binder"
        lead="With the issue built, switch to preview to see every page together, then export print-ready PDFs — one for the cover spread and one for the internal pages."
      />

      <H2>Switch to preview</H2>
      <P>
        In the sidebar, click <UI>Live Preview &amp; Export</UI> (the other mode, next to <UI>Template Layouts</UI>). The
        canvas now shows all nine pages laid out, exactly as they&apos;ll print.
      </P>
      <Figure src="/training/img/preview-export.png" alt="Live Preview & Export mode with export buttons" caption="Live Preview & Export — review every page, then download the PDFs." />

      <H2>Export the PDFs</H2>
      <P>The binder exports as two separate files so the cover and the inside pages can be printed on different stock:</P>
      <Steps>
        <Step n={1} title="Download Cover PDF">
          Produces the cover spread (front and back). The button shows <UI>Preparing PDF…</UI> while it renders, then your
          browser downloads the file.
        </Step>
        <Step n={2} title="Download Internal Pages PDF">
          Produces every inside page — title page through contents — as a single print-ready file.
        </Step>
        <Step n={3} title="Or use Print">
          The <UI>Print</UI> button opens your browser&apos;s print dialog for a quick proof or to print directly.
        </Step>
      </Steps>

      <Callout type="note" title="File names">
        Exports are named from the journal and issue, e.g.{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">abbrev-volume-9-issue-1-cover.pdf</code> and{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">…-internal-pages.pdf</code>, so they&apos;re easy to
        file and send to the printer.
      </Callout>

      <H2>Exporting many journals at once</H2>
      <P>
        Below the buttons, the <UI>Batch export</UI> panel lets you tick several journals (use the filter box, or{" "}
        <UI>Select shown</UI>) and download all their covers or all their internal sets combined into one PDF.
      </P>
      <Callout type="warning" title="Keep batches modest">
        Combining many journals is memory-heavy. Around <strong>25 journals at a time</strong> is a safe limit — split
        larger jobs into a few batches.
      </Callout>

      <H2>Back up and restore your work</H2>
      <P>
        Still in this mode, <UI>Export Drafts (JSON)</UI> downloads all your issue drafts as a single file, and{" "}
        <UI>Import Drafts (JSON)</UI> restores them. Keep an export as a backup, or use it to move drafts between
        environments.
      </P>

      <Callout type="tip" title="Cover looks blank in the PDF?">
        That almost always means a cover was linked from an external web address that the server can&apos;t reach. Re-open
        the journal and <strong>upload</strong> the cover image instead of pasting a URL (see{" "}
        <Link href="/guide/journal" className="font-medium underline">
          Step 2
        </Link>
        ), then export again.
      </Callout>

      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="font-semibold text-slate-900">That&apos;s the full flow 🎉</p>
        <p className="mt-1 text-sm text-slate-600">
          Set up shared data once, create a journal, build each issue across the nine sections, then preview and export the
          binder. Revisit any step from the sidebar, or watch the{" "}
          <Link href="/guide" className="font-medium underline">
            video tour
          </Link>{" "}
          again any time.
        </p>
      </div>

      <PrevNext current="print" />
    </article>
  );
}
