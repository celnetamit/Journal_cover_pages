"use client";

import { EntityForm, Text, Area, ImageField, type FormState } from "@/components/forms/Fields";

type Values = {
  heading: string;
  leadText: string;
  steps: string;
  scanLabel: string;
  logoUrl: string;
};

export default function ManuscriptEngineForm({ action, values, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin">
      <Text name="heading" label="Heading" defaultValue={values?.heading} />
      <ImageField
        name="logoUrl"
        label="Manuscript engine logo"
        defaultValue={values?.logoUrl}
        hint="Shown on the Manuscript page. Wide landscape PNG with a transparent background (or SVG), about 3:1. Recommended ≥ 700×260px, max ~2 MB."
      />
      <Area name="leadText" label="Intro paragraph" defaultValue={values?.leadText} rows={3} />
      <Area name="steps" label="Submission steps (one per line)" defaultValue={values?.steps} rows={5} />
      <Text name="scanLabel" label="QR caption" defaultValue={values?.scanLabel} />
    </EntityForm>
  );
}
