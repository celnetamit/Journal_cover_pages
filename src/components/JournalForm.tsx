"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { JournalActionState } from "@/app/actions/journals";

export type JournalFormValues = {
  name: string;
  abbreviation: string;
  slug: string;
  shortName: string;
  website: string;
  issnOnline: string;
  issnPrint: string;
  sjif: string;
  icv: string;
  doi: string;
  impactFactor: string;
  about: string;
  manuscriptNotice: string;
  manuscriptUrl: string;
  directorDeskTitle: string;
  directorDeskParagraphs: string;
  frequency: string;
  frequencyLabel: string;
  issuesPerYear: string;
  typeOfPublication: string;
  access: string;
  language: string;
  coverFrontUrl: string;
  coverBackUrl: string;
  logoUrl: string;
  indexingLogoUrl: string;
  domainId: string;
  publisherId: string;
  managerId: string;
  focusScope: string;
  focusNotes: string;
  objectives: string;
  salientFeatures: string;
  keywords: string;
  indexing: string;
};

type Option = { id: string; label: string };

const FREQUENCIES = ["ANNUAL", "BIANNUAL", "TRIANNUAL", "QUARTERLY", "BIMONTHLY", "MONTHLY", "OTHER"];

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
const labelClass = "block text-sm font-medium text-slate-700";

function Text({ name, label, defaultValue, type = "text", required = false }: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className={input} />
    </label>
  );
}

function Area({ name, label, defaultValue, rows = 3, hint }: {
  name: string; label: string; defaultValue?: string; rows?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      <textarea name={name} rows={rows} defaultValue={defaultValue} className={input} />
    </label>
  );
}

function Select({ name, label, defaultValue, options, placeholder }: {
  name: string; label: string; defaultValue?: string; options: Option[]; placeholder: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={input}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function JournalForm({
  action,
  values,
  options,
  submitLabel,
}: {
  action: (prev: JournalActionState, formData: FormData) => Promise<JournalActionState>;
  values?: Partial<JournalFormValues>;
  options: { domains: Option[]; publishers: Option[]; profiles: Option[] };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<JournalActionState, FormData>(action, undefined);
  const v = values ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text name="name" label="Journal name" defaultValue={v.name} required />
        <Text name="abbreviation" label="Abbreviation" defaultValue={v.abbreviation} required />
        <Text name="shortName" label="Short name" defaultValue={v.shortName} />
        <Text name="slug" label="Slug (blank = auto)" defaultValue={v.slug} />
        <Text name="website" label="Website" defaultValue={v.website} />
        <Text name="manuscriptUrl" label="Manuscript submission URL (QR)" defaultValue={v.manuscriptUrl} />
        <Text name="doi" label="DOI" defaultValue={v.doi} />
        <Text name="issnPrint" label="ISSN (print)" defaultValue={v.issnPrint} />
        <Text name="issnOnline" label="ISSN (online)" defaultValue={v.issnOnline} />
        <Text name="sjif" label="SJIF" defaultValue={v.sjif} />
        <Text name="icv" label="ICV" defaultValue={v.icv} />
        <Text name="impactFactor" label="Impact factor" defaultValue={v.impactFactor} />
        <Text name="issuesPerYear" label="Issues per year" type="number" defaultValue={v.issuesPerYear} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Frequency</span>
          <select name="frequency" defaultValue={v.frequency ?? "OTHER"} className={input}>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <Text name="frequencyLabel" label="Frequency label" defaultValue={v.frequencyLabel} />
        <Text name="language" label="Language" defaultValue={v.language} />
        <Text name="typeOfPublication" label="Type of publication" defaultValue={v.typeOfPublication} />
        <Text name="access" label="Access" defaultValue={v.access} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select name="domainId" label="Domain" defaultValue={v.domainId} options={options.domains} placeholder="— none —" />
        <Select name="publisherId" label="Publisher" defaultValue={v.publisherId} options={options.publishers} placeholder="— none —" />
        <Select name="managerId" label="Journal manager" defaultValue={v.managerId} options={options.profiles} placeholder="— none —" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text name="coverFrontUrl" label="Front cover image URL" defaultValue={v.coverFrontUrl} />
        <Text name="coverBackUrl" label="Back cover image URL" defaultValue={v.coverBackUrl} />
        <Text name="logoUrl" label="Journal logo URL" defaultValue={v.logoUrl} />
        <Text name="indexingLogoUrl" label="Indexing logo URL" defaultValue={v.indexingLogoUrl} />
      </section>

      <section className="space-y-4">
        <Area name="about" label="About" defaultValue={v.about} rows={4} />
        <Area name="focusScope" label="Focus & scope" defaultValue={v.focusScope} rows={5} hint="One item per line" />
        <Area name="focusNotes" label="Focus notes (About page paragraphs)" defaultValue={v.focusNotes} rows={4} hint="One paragraph per line. Use {publisher} / {journal} for auto-filled names." />
        <Area name="objectives" label="Objectives" defaultValue={v.objectives} rows={4} hint="One item per line" />
        <Area name="salientFeatures" label="Salient features" defaultValue={v.salientFeatures} rows={4} hint="One item per line" />
        <Area name="keywords" label="Keywords" defaultValue={v.keywords} rows={2} hint="Comma-separated" />
        <Area name="indexing" label="Indexing" defaultValue={v.indexing} rows={2} hint="Comma-separated" />
        <Area name="manuscriptNotice" label="Manuscript notice" defaultValue={v.manuscriptNotice} rows={3} />
        <Area name="directorDeskTitle" label="Director's Desk heading" defaultValue={v.directorDeskTitle} rows={1} hint="Blank = use the Company/brand default" />
        <Area name="directorDeskParagraphs" label="Director's Desk letter" defaultValue={v.directorDeskParagraphs} rows={8} hint="One paragraph per line. Tokens: {journal} {volume} {domain} {publisher}. Blank = Company default." />
      </section>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/journals" className="text-sm text-slate-600 hover:text-slate-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
