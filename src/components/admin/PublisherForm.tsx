"use client";

import { EntityForm, Text, Area, ImageField, Select, type FormState, type Option } from "@/components/forms/Fields";
import { defaultAboutNotes } from "@/lib/binder-content";

type Values = { name: string; logoUrl: string; companyId: string; about: string; salientFeatures: string; objectives: string; aboutNotes: string; email: string; phone: string; website: string };

export default function PublisherForm({ action, values, companies, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  companies: Option[];
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
      <Select name="companyId" label="Company" defaultValue={values?.companyId} options={companies} />
      <Area
        name="about"
        label="About (About-page top paragraph)"
        defaultValue={values?.about}
        rows={4}
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
      <Area
        name="aboutNotes"
        label="Closing paragraphs (About page)"
        defaultValue={values?.aboutNotes || defaultAboutNotes.join("\n")}
        rows={8}
        hint="One paragraph per line. Tokens {journal} {publisher} {email} are filled in per journal. Pre-filled with the standard text — edit as needed."
      />
    </EntityForm>
  );
}
