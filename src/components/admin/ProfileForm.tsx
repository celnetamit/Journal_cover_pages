"use client";

import { EntityForm, Text, Area, ImageField, type FormState } from "@/components/forms/Fields";

type Values = {
  name: string; email: string; designation: string; department: string;
  affiliation: string; address: string; biography: string; photoUrl: string;
};

export default function ProfileForm({ action, values, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/profiles">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text name="name" label="Full name" defaultValue={values?.name} required />
        <Text name="email" label="Email" type="email" defaultValue={values?.email} />
        <Text name="designation" label="Designation" defaultValue={values?.designation} />
        <Text name="department" label="Department" defaultValue={values?.department} />
        <Text name="affiliation" label="Affiliation" defaultValue={values?.affiliation} />
        <Text name="address" label="Location / address" defaultValue={values?.address} />
      </div>
      <ImageField name="photoUrl" label="Photo" defaultValue={values?.photoUrl} />
      <Area name="biography" label="Biography" defaultValue={values?.biography} rows={4} />
    </EntityForm>
  );
}
