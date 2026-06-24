import Link from "next/link";
import { PageHeader, H2, P, Callout, Figure, Steps, Step, UI, PrevNext } from "@/components/guide/parts";

export const metadata = { title: "Guide · Create a journal" };

export default function GuideJournalPage() {
  return (
    <article>
      <PageHeader
        num={2}
        title="Create a journal"
        lead="A journal is the reusable home for everything that stays the same across issues — its name, identifiers, covers, board and subscription prices. You create it once, then build issue after issue from it."
      />

      <H2>Add a new journal</H2>
      <Steps>
        <Step n={1} title="Open the journals list">
          Click <UI>Journals</UI> in the top navigation (or go to{" "}
          <Link href="/journals" className="font-medium text-slate-900 underline">
            /journals
          </Link>
          ). You&apos;ll see every journal, with search to filter.
        </Step>
        <Step n={2} title="Click New journal">
          This opens the journal form. Only <UI>Journal name</UI> and <UI>Abbreviation</UI> are required — everything else
          can be filled in now or later.
        </Step>
        <Step n={3} title="Fill in the details">
          Work down the form (described below), then click <UI>Create journal</UI>. You&apos;ll return to the list with the
          new journal added.
        </Step>
      </Steps>

      <Figure src="/training/img/journals-list.png" alt="The journals list page" caption="The Journals list — search, open, or add a new journal." />

      <H2>What goes in the form</H2>
      <P>The fields are grouped. Here&apos;s what each group is for and where it ends up in the binder:</P>
      <ul className="my-4 space-y-3 text-slate-700">
        <li>
          <strong>Identity</strong> — name, abbreviation, short name, slug, website, <UI>Manuscript submission URL</UI>{" "}
          (encoded in the Manuscript-page QR; pre-filled with the manuscript-engine URL), <UI>Editorial board URL</UI>{" "}
          (linked when the board is truncated to 12) and DOI.
        </li>
        <li>
          <strong>Identifiers &amp; metrics</strong> — print and online ISSN, SJIF, ICV, impact factor, and{" "}
          <UI>Issues per year</UI> — a dropdown built from your configured subscription tiers, so it always matches a
          pricing tier.
        </li>
        <li>
          <strong>Publication info</strong> — language, type of publication and access model. <UI>Frequency</UI> is
          derived automatically from Issues per year (2 → Biannual, 3 → Triannual, …), so there&apos;s no separate
          frequency field.
        </li>
        <li>
          <strong>Links</strong> — pick the journal&apos;s <UI>Domain</UI>, <UI>Publisher</UI> and{" "}
          <UI>Journal manager</UI> from the records you created in Step 1. This is how the publisher/company/domain logos,
          imprint, About, seal and contacts flow onto the pages automatically.
        </li>
        <li>
          <strong>Images</strong> — upload the <UI>Front cover image</UI> and <UI>Back cover image</UI> (portrait A4,
          ≈1240×1754px). The cover&apos;s bottom-left logo comes from the Publisher and the bottom-right from the Domain —
          there is no per-journal logo.
        </li>
        <li>
          <strong>Content</strong> — one-per-line <UI>Focus &amp; scope</UI>, and the <UI>Director&apos;s Desk heading</UI>{" "}
          &amp; <UI>letter</UI> (supports tokens like {"{journal}"} and {"{volume}"}). About, Objectives and Salient
          features come from the <strong>Publisher</strong>.
        </li>
      </ul>

      <Callout type="warning" title="Uploading covers vs. linking a URL">
        Prefer <strong>uploading</strong> the cover image rather than pasting an external web address. Uploaded images are
        stored with the app and always render; an external link depends on that other website staying reachable, which can
        leave the cover blank in some environments.
      </Callout>

      <H2>After it&apos;s created: board & team</H2>
      <P>
        Open a journal and choose <UI>Edit</UI>. Below the main form you&apos;ll find the{" "}
        <UI>Board &amp; Team editor</UI>: add the editorial board and management team for this journal, choosing each
        person&apos;s role. These feed the <UI>Editorial</UI> and <UI>Management</UI> pages of every issue, and you can
        pull people straight from your saved{" "}
        <Link href="/admin/profiles" className="font-medium text-slate-900 underline">
          Profiles
        </Link>
        .
      </P>
      <Callout type="note" title="Subscription prices are global">
        Prices aren&apos;t set per journal anymore — they come from the frequency tier matching the journal&apos;s
        Issues-per-year (<Link href="/admin/subscription-pricing" className="font-medium text-slate-900 underline">Setup → Subscription pricing</Link>). Pick the right Issues-per-year and the matching prices render automatically.
      </Callout>

      <Callout type="tip">
        Anything you set on the journal record becomes the <em>default</em> for every new issue. When you build an issue
        you can still customise a page just for that issue without changing the journal — see the next step.
      </Callout>

      <PrevNext current="journal" />
    </article>
  );
}
