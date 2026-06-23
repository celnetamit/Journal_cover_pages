import Link from "next/link";
import { PageHeader, H2, P, Callout, Figure, Steps, Step, UI, PrevNext } from "@/components/guide/parts";

export const metadata = { title: "Guide · Set up shared data" };

const ENTITIES = [
  ["Companies", "The legal entity behind a publisher — registered & sales address, bank details, CIN, printed-by line, and open-access charges. Feeds the Title Page and Subscription page.", "/admin/companies"],
  ["Publishers", "A publisher belongs to a company. Holds the publisher name, logo, about paragraph, email and phone. Feeds the cover logos and the About/Subscription pages.", "/admin/publishers"],
  ["Profiles", "People — editors, directors, board and team members, with photos and signatures. Reused across Management, Editorial and the Director's Desk.", "/admin/profiles"],
  ["Domains", "Subject areas (e.g. Management, Law) and the manager assigned to them.", "/admin/domains"],
  ["Subscription pricing", "Frequency-based price tiers (by issues per year). A journal's Issues-per-year picks its tier on the Subscription page.", "/admin/subscription-pricing"],
  ["Manuscript engine", "The shared Manuscript-page content and logo, edited once and used by every journal.", "/admin/manuscript-engine"],
];

export default function GuideSetupPage() {
  return (
    <article>
      <PageHeader
        num={1}
        title="Set up shared data"
        lead="Before building issues, set up the records that every journal reuses. Enter them once here and they flow into the right pages automatically — so your binders stay consistent and updates only need to happen in one place."
      />

      <P>
        Open <UI>Setup</UI> from the top navigation (or go to{" "}
        <Link href="/admin" className="font-medium text-slate-900 underline">
          /admin
        </Link>
        ). Each card is one type of record, with a count of how many you already have.
      </P>

      <H2>Watch the Setup walkthrough</H2>
      <P>This 3-minute video walks through every record type in the Setup area, in order.</P>
      <video
        controls
        preload="metadata"
        className="w-full rounded-xl border border-slate-200 shadow-sm"
        src="/training/journal-setup-training.mp4"
      >
        Your browser does not support embedded video.
      </video>

      <Figure src="/training/img/setup-hub.png" alt="The Setup hub with cards for each data type" caption="Setup hub — one card per type of shared record." />

      <H2>Recommended order</H2>
      <P>
        Records reference each other, so it&apos;s easiest to create them in this order. You can always come back and edit
        anything later.
      </P>
      <Steps>
        <Step n={1} title="Companies">
          Start here — a publisher points to a company. Add the legal name, registered and sales addresses, bank details,
          CIN and the &ldquo;printed by&rdquo; line.
        </Step>
        <Step n={2} title="Publishers">
          Create the publisher and link it to its company. Upload the publisher logo and write the short &ldquo;about&rdquo;
          paragraph, email and phone.
        </Step>
        <Step n={3} title="Profiles">
          Add the people you&apos;ll reuse: editors-in-chief, directors, board members and team. Upload photos, and a
          signature image for anyone who signs the Director&apos;s Desk letter.
        </Step>
        <Step n={4} title="Domains & Subscription pricing">
          Add your subject domains, then the frequency-based subscription price tiers (by issues per year). Each
          journal&apos;s Issues-per-year auto-selects its tier on the Subscription page.
        </Step>
        <Step n={5} title="Manuscript engine">
          Set the shared Manuscript-page content and logo once — every journal picks it up. (About-page text — about, objectives, salient features and closing paragraphs — lives on each Publisher record.)
        </Step>
      </Steps>

      <H2>What each record is for</H2>
      <div className="my-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Record</th>
              <th className="px-4 py-2 font-medium">What it holds &amp; where it shows up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ENTITIES.map(([name, desc, href]) => (
              <tr key={name}>
                <td className="px-4 py-3 align-top">
                  <Link href={href} className="font-medium text-slate-900 underline">
                    {name}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top text-slate-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="Search & bulk import/export">
        Every list page has a search box to filter quickly. You can also import records in bulk from a CSV (it updates
        existing rows and adds new ones) and export the current data back to CSV — handy for setting up many records at
        once or keeping a backup.
      </Callout>

      <Callout type="note" title="Admin-only records">
        <UI>Users</UI> (login accounts &amp; roles) and <UI>Sign-in domains</UI> (domains allowed for Google sign-in) only
        appear for administrators. Regular editors don&apos;t need them to build issues.
      </Callout>

      <PrevNext current="setup" />
    </article>
  );
}
