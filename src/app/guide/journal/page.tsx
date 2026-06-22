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
          <strong>Identity</strong> — name, abbreviation, short name, slug, website and DOI. The name and abbreviation
          appear on the cover and throughout the pages.
        </li>
        <li>
          <strong>Identifiers &amp; metrics</strong> — print and online ISSN, SJIF, ICV, impact factor and issues per
          year. These print on the cover and title page.
        </li>
        <li>
          <strong>Publication info</strong> — frequency, frequency label, language, type of publication and access model.
        </li>
        <li>
          <strong>Links</strong> — pick the journal&apos;s <UI>Domain</UI>, <UI>Publisher</UI> and{" "}
          <UI>Journal manager</UI> from the records you created in Step 1. This is how the publisher logo, imprint and
          contacts flow onto the pages automatically.
        </li>
        <li>
          <strong>Images</strong> — upload the <UI>Front cover image</UI>, <UI>Back cover image</UI> and{" "}
          <UI>Journal logo</UI>. Use a portrait A4 image (≈1240×1754px) for covers.
        </li>
        <li>
          <strong>Content</strong> — the <UI>About</UI> text and one-per-line <UI>Focus &amp; scope</UI>,{" "}
          <UI>Objectives</UI>, <UI>Salient features</UI> and comma-separated <UI>Keywords</UI>.
        </li>
      </ul>

      <Callout type="warning" title="Uploading covers vs. linking a URL">
        Prefer <strong>uploading</strong> the cover image rather than pasting an external web address. Uploaded images are
        stored with the app and always render; an external link depends on that other website staying reachable, which can
        leave the cover blank in some environments.
      </Callout>

      <H2>After it&apos;s created: board, team & subscriptions</H2>
      <P>
        Open a journal and choose <UI>Edit</UI>. Below the main form you&apos;ll find two extra editors that belong to the
        journal:
      </P>
      <Steps>
        <Step n={1} title="Board & Team editor">
          Add the editorial board and management team for this journal, choosing each person&apos;s role. These feed the{" "}
          <UI>Editorial</UI> and <UI>Management</UI> pages of every issue. You can pull people straight from your saved{" "}
          <Link href="/admin/profiles" className="font-medium text-slate-900 underline">
            Profiles
          </Link>
          .
        </Step>
        <Step n={2} title="Subscription overrides">
          If this journal&apos;s prices differ from the global plans, set the overrides here. Otherwise it uses the
          defaults from Step 1.
        </Step>
      </Steps>

      <Callout type="tip">
        Anything you set on the journal record becomes the <em>default</em> for every new issue. When you build an issue
        you can still customise a page just for that issue without changing the journal — see the next step.
      </Callout>

      <PrevNext current="journal" />
    </article>
  );
}
