"use client";

import { EntityForm, Text, Area, ImageField, type FormState } from "@/components/forms/Fields";

type Values = {
  name: string; email: string; designation: string; department: string;
  affiliation: string; address: string; biography: string; photoUrl: string;
  signatureUrl: string;
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
      <ImageField
        name="photoUrl"
        label="Photo"
        defaultValue={values?.photoUrl}
        hint="Square headshot, face centred. JPG or PNG, recommended ≥ 400×400px, max ~2 MB."
      />
      <ImageField
        name="signatureUrl"
        label="Signature (for Director's Desk)"
        defaultValue={values?.signatureUrl}
        hint="Handwritten signature on a transparent background (PNG), dark ink, cropped tight. Wide ~3:1, recommended ~600×200px, max ~1 MB."
      />
      <Area name="biography" label="Biography" defaultValue={values?.biography} rows={4} />
    </EntityForm>
  );
}
