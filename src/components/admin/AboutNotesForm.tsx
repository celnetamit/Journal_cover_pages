"use client";

import { EntityForm, Area, type FormState } from "@/components/forms/Fields";

type Values = { paragraphs: string };

export default function AboutNotesForm({ action, values, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin">
      <Area
        name="paragraphs"
        label="Closing paragraphs (one per line)"
        defaultValue={values?.paragraphs}
        rows={14}
        hint="Shown at the bottom of every journal's About page. One paragraph per line (blank lines are ignored). Use {journal} for the journal name, {publisher} for the publisher name, and {email} for the publisher email — they are filled in per journal."
      />
    </EntityForm>
  );
}
