"use client";

import { EntityForm, Text, Area, ImageField, Select, SearchableSelect, Checkbox, type FormState, type Option } from "@/components/forms/Fields";

type Values = { name: string; logoUrl: string; sealUrl: string; companyId: string; about: string; disciplines: string; salientFeatures: string; objectives: string; email: string; phone: string; website: string; subscriptionManagerId: string; dispatchManagerId: string; showJournalsOnManagement: boolean };

export default function PublisherForm({ action, values, companies, profiles, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  companies: Option[];
  profiles: Option[];
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/publishers">
      <Text name="name" label="Publisher name" defaultValue={values?.name} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text name="email" label="Contact email (Legal Disputes line)" type="email" defaultValue={values?.email} />
        <Text name="phone" label="Contact phone (Legal Disputes line)" defaultValue={values?.phone} />
      </div>
      <Text name="website" label="Website (title page)" defaultValue={values?.website} />
      <ImageField
        name="logoUrl"
        label="Logo"
        defaultValue={values?.logoUrl}
        hint="Title-page logo. PNG with a transparent background (or SVG), landscape orientation. Recommended ≥ 600×400px, max ~2 MB."
      />
      <ImageField
        name="sealUrl"
        label="Publisher seal"
        defaultValue={values?.sealUrl}
        hint="Official seal/stamp shown near the Director's signature. PNG with a transparent background, roughly square. Recommended ≥ 400×400px, max ~2 MB."
      />
      <Select name="companyId" label="Company" defaultValue={values?.companyId} options={companies} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchableSelect
          name="subscriptionManagerId"
          label="Subscription manager (profile)"
          defaultValue={values?.subscriptionManagerId}
          options={profiles}
          placeholder="Search profiles by name…"
        />
        <SearchableSelect
          name="dispatchManagerId"
          label="Dispatch manager (profile)"
          defaultValue={values?.dispatchManagerId}
          options={profiles}
          placeholder="Search profiles by name…"
        />
      </div>
      <Checkbox
        name="showJournalsOnManagement"
        label="Show this publisher's journals on the management page"
        defaultChecked={values?.showJournalsOnManagement}
        hint="When enabled, the management page lists all of this publisher's journals (two columns) below the journal name."
      />
      <Area
        name="about"
        label="About (About-page top paragraph)"
        defaultValue={values?.about}
        rows={4}
      />
      <Area
        name="disciplines"
        label="Disciplines ({disciplines} token)"
        defaultValue={values?.disciplines}
        rows={2}
        hint={`Fills the {disciplines} token in the Director's Desk letter. Blank defaults to "scientific, technical, and medical disciplines".`}
      />
      <Area
        name="salientFeatures"
        label="Salient features (About page)"
        defaultValue={values?.salientFeatures}
        rows={5}
        hint="One item per line. Shared by all this publisher's journals."
      />
      <Area
        name="objectives"
        label="Objectives (About page)"
        defaultValue={values?.objectives}
        rows={4}
        hint="One item per line. Shared by all this publisher's journals."
      />
    </EntityForm>
  );
}
