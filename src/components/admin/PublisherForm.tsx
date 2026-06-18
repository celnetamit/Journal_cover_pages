"use client";

import { EntityForm, Text, Area, ImageField, Select, type FormState, type Option } from "@/components/forms/Fields";

type Values = { name: string; logoUrl: string; companyId: string; about: string };

export default function PublisherForm({ action, values, companies, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  companies: Option[];
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/publishers">
      <Text name="name" label="Publisher name" defaultValue={values?.name} required />
      <ImageField name="logoUrl" label="Logo" defaultValue={values?.logoUrl} />
      <Select name="companyId" label="Company" defaultValue={values?.companyId} options={companies} />
      <Area
        name="about"
        label="About (Page 3 top paragraph)"
        defaultValue={values?.about}
        rows={4}
      />
    </EntityForm>
  );
}
