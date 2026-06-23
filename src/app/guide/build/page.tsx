import Link from "next/link";
import { PageHeader, H2, P, Callout, Figure, Steps, Step, UI, PrevNext } from "@/components/guide/parts";

export const metadata = { title: "Guide · Build an issue" };

const SECTIONS: [string, string, string][] = [
  [
    "1. Cover Spread",
    "The front and back cover.",
    "Set the title, volume, issue, month range and year, and upload front/back cover artwork plus the bottom-left (publisher) and bottom-right (journal) logos. Watch the live canvas update as you type.",
  ],
  [
    "2. Title Page",
    "The publisher imprint.",
    "Printed-by line, publisher address, phone, email and website, registered office and CIN. Most of this is pre-filled from the publisher and company you linked.",
  ],
  [
    "3. About",
    "Description & focus.",
    "Focus & scope is per-journal (edit here, then Save About & Focus to journal). About, Objectives, Salient features and the closing paragraphs come from the journal's Publisher record.",
  ],
  [
    "4. Subscription",
    "Prices, bank & legal.",
    "Subscription prices auto-render from the frequency tier matching the journal's Issues-per-year (set in Setup → Subscription pricing). Bank & legal come from the company. Use Load Current Text for an editable override.",
  ],
  [
    "5. Management",
    "Heads, officers, contacts.",
    "Add management heads and officers (with photos), and fill the dispatch and sales contact boxes. You can fill a person from a saved profile.",
  ],
  [
    "6. Manuscript",
    "Submission notice & QR.",
    "The manuscript submission notification, with a per-journal QR code. The {email} token is filled in with the publisher email automatically.",
  ],
  [
    "7. Editorial",
    "The editorial board.",
    "Add board rows and choose each person's role — Editor in Chief, Associate Editor-in-Chief or Editor. The page groups and orders them for you. Insert Sample Board gives you a starting point.",
  ],
  [
    "8. Director",
    "The Director's Desk.",
    "The director's name, role label, photo and signature. The letter text itself is managed in the journal's Setup and supports tokens like {journal} and {volume}.",
  ],
  [
    "9. Contents",
    "The table of contents.",
    "Click Add Article and enter the title, author(s) and page number for each article. The contents page is laid out and paginated for you.",
  ],
];

export default function GuideBuildPage() {
  return (
    <article>
      <PageHeader
        num={3}
        title="Build an issue"
        lead="This is where you assemble a specific issue. You pick the journal and issue, then move through the nine sections, filling each one while a live preview shows exactly how it will print."
      />

      <H2>The editor at a glance</H2>
      <P>
        The home screen is the editor. On the left you choose what you&apos;re working on; the centre is a{" "}
        <UI>Realtime Live Canvas</UI> that mirrors the active page; the right panel holds the form fields for that page.
      </P>
      <Figure src="/training/img/cover-editor.png" alt="The issue editor with sidebar, live canvas and form panel" caption="The editor: journal & issue picker (left), live canvas (centre), section form (right)." />

      <H2>Pick the journal and issue</H2>
      <Steps>
        <Step n={1} title="Select the journal">
          Use the <UI>Select journal</UI> search box in the sidebar and start typing the name or abbreviation, then click
          the match.
        </Step>
        <Step n={2} title="Choose or start an issue">
          The <UI>Issue</UI> dropdown lists saved issues as <em>Vol · No · Year</em>. Choose one to edit it, or pick{" "}
          <UI>＋ New issue…</UI> to start a fresh one. A saved issue can be removed with <UI>Delete</UI>.
        </Step>
        <Step n={3} title="Watch the save state">
          The card shows <UI>● Unsaved changes</UI> or <UI>✓ All changes saved</UI>. If someone else edited the same issue
          since you opened it, you&apos;ll be offered <UI>Load latest</UI> or <UI>Keep mine</UI> so nothing is lost.
        </Step>
      </Steps>

      <H2>Move through the nine sections</H2>
      <P>
        The tab bar across the top — <UI>Active editor target</UI> — switches between the nine pages. Click any tab to jump
        to it, or use the arrows to step in order. Edit the fields on the right and the canvas updates instantly. When a
        page is done, click its <UI>Save Page N Details</UI> button.
      </P>

      <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECTIONS.map(([title, tag, desc]) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{tag}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
          </div>
        ))}
      </div>

      <Figure src="/training/img/section-editorial.png" alt="The Editorial section editor" caption="Editorial — add board rows and set each role; the page orders them automatically." />

      <Callout type="note" title="Synced from record vs. customised for this issue">
        Each page starts <strong>synced</strong> from the journal record, so it&apos;s correct by default. Edit it and that
        page becomes <strong>customised for this issue</strong> — your change applies only here. Use{" "}
        <UI>Sync this page from record</UI> to revert one page, or <UI>Sync all pages from record</UI> to reset
        everything to the journal&apos;s defaults.
      </Callout>

      <Figure src="/training/img/section-contents.png" alt="The Contents section editor" caption="Contents — add an article row per paper with title, authors and page." />

      <Callout type="tip" title="Save as you go">
        Save each page after you finish it. The save state in the sidebar always tells you whether there&apos;s anything
        unsaved, and on the Contents page <UI>Save All Details</UI> stores everything at once.
      </Callout>

      <P>
        When all nine sections look right in the live canvas, you&apos;re ready to{" "}
        <Link href="/guide/print" className="font-medium text-slate-900 underline">
          preview and print the binder
        </Link>
        .
      </P>

      <PrevNext current="build" />
    </article>
  );
}
