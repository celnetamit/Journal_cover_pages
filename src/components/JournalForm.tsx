"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { JournalActionState } from "@/app/actions/journals";
import { ImageField } from "@/components/forms/Fields";
import { RichTextField } from "@/components/RichTextField";
import { defaultManuscriptUrl } from "@/lib/binder-content";
import { frequencyFromIssues } from "@/lib/binder-format";

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
  manuscriptUrl: string;
  editorialBoardUrl: string;
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
  domainId: string;
  publisherId: string;
  managerId: string;
  focusScope: string;
};

type Option = { id: string; label: string };

const input =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
const labelClass = "block text-sm font-medium text-slate-700";

function Text({ name, label, defaultValue, type = "text", required = false, hint }: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean; hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      <input name={name} type={type} required={required} defaultValue={defaultValue} className={input} />
    </label>
  );
}

function Area({ name, label, defaultValue, rows = 3, hint, rich = true }: {
  name: string; label: string; defaultValue?: string; rows?: number; hint?: string; rich?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
      {rich ? (
        <RichTextField name={name} defaultValue={defaultValue} multiline rows={rows} ariaLabel={label} className="mt-1" />
      ) : (
        <textarea name={name} rows={rows} defaultValue={defaultValue} className={input} />
      )}
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
  options: { domains: Option[]; publishers: Option[]; profiles: Option[]; issuesPerYearOptions: number[] };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<JournalActionState, FormData>(action, undefined);
  const v = values ?? {};
  // Issues-per-year drives the auto-derived frequency shown below.
  const [issues, setIssues] = useState(v.issuesPerYear ?? "");
  const derivedFrequency = frequencyFromIssues(issues);

  return (
    <form action={formAction} className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text name="name" label="Journal name" defaultValue={v.name} required />
        <Text name="abbreviation" label="Abbreviation" defaultValue={v.abbreviation} required />
        <Text name="shortName" label="Short name" defaultValue={v.shortName} />
        <Text name="slug" label="Slug (blank = auto)" defaultValue={v.slug} />
        <Text name="website" label="Website" defaultValue={v.website} />
        <Text name="manuscriptUrl" label="Manuscript submission URL (QR)" defaultValue={v.manuscriptUrl || defaultManuscriptUrl} />
        <Text name="editorialBoardUrl" label="Editorial board URL (full list)" defaultValue={v.editorialBoardUrl} />
        <Text name="doi" label="DOI" defaultValue={v.doi} />
        <Text name="issnPrint" label="ISSN (print)" defaultValue={v.issnPrint} />
        <Text name="issnOnline" label="ISSN (online)" defaultValue={v.issnOnline} />
        <Text name="sjif" label="SJIF" defaultValue={v.sjif} />
        <Text name="icv" label="ICV" defaultValue={v.icv} />
        <Text name="impactFactor" label="Impact factor" defaultValue={v.impactFactor} />
        <label className="block">
          <span className={labelClass}>Issues per year</span>
          {options.issuesPerYearOptions.length ? (
            <select name="issuesPerYear" value={issues} onChange={(e) => setIssues(e.target.value)} className={input}>
              <option value="">— select —</option>
              {options.issuesPerYearOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              {issues && !options.issuesPerYearOptions.map(String).includes(issues) ? (
                <option value={issues}>{issues} (no matching tier)</option>
              ) : null}
            </select>
          ) : (
            <input name="issuesPerYear" type="number" value={issues} onChange={(e) => setIssues(e.target.value)} className={input} />
          )}
          <span className="mt-1 block text-xs text-slate-500">From the configured subscription tiers — picks the matching pricing on the Subscription page, and sets the frequency below.</span>
        </label>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Frequency (auto)</span>
          <div className={`${input} bg-slate-50 text-slate-600`}>
            {derivedFrequency.label || "Other"}
          </div>
          <span className="mt-1 block text-xs text-slate-500">Set automatically from Issues per year.</span>
        </label>
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
        <ImageField name="coverFrontUrl" label="Front cover image" defaultValue={v.coverFrontUrl} hint="Portrait A4 background (≈1240×1754px), fills the panel center-cropped. The top ~28% (title/issue/ISSN band) and bottom ~13% (footer logos) render on top — keep the key artwork in the centre." />
        <ImageField name="coverBackUrl" label="Back cover image" defaultValue={v.coverBackUrl} hint="Full-page back cover artwork shown as-is (no overlay), portrait A4 ratio (≈1240×1754px or larger). JPG or PNG." />
      </section>

      <section className="space-y-4">
        <Area name="focusScope" label="Focus & scope" defaultValue={v.focusScope} rows={5} hint="One item per line" />
        <Area name="directorDeskTitle" label="Director's Desk heading" defaultValue={v.directorDeskTitle} rows={1} hint="Blank = use the Company/brand default" />
        <Area name="directorDeskParagraphs" label="Director's Desk letter" defaultValue={v.directorDeskParagraphs} rows={8} hint="One paragraph per line. Tokens: {journal} {abbreviation} {journal short name} {year} {volume} {issue} {domain} {publisher}. Blank = standard default letter." />
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
