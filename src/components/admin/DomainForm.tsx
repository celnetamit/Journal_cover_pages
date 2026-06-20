"use client";

import { EntityForm, Text, ImageField, Select, type FormState, type Option } from "@/components/forms/Fields";

type Values = { name: string; logoUrl: string; managerId: string };

export default function DomainForm({ action, values, profiles, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  profiles: Option[];
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/domains">
      <Text name="name" label="Domain name" defaultValue={values?.name} required />
      <ImageField
        name="logoUrl"
        label="Logo"
        defaultValue={values?.logoUrl}
        hint="Domain/subject mark. PNG with a transparent background (or SVG). Recommended ≥ 400×400px, max ~2 MB."
      />
      <Select name="managerId" label="Manager (profile)" defaultValue={values?.managerId} options={profiles} />
    </EntityForm>
  );
}
