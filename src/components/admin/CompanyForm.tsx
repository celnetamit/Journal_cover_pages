"use client";

import { EntityForm, Text, Area, ImageField, Select, type FormState, type Option } from "@/components/forms/Fields";

type Values = {
  name: string; email: string; phone: string; website: string; logoUrl: string;
  registeredAddress: string; salesAddress: string; cin: string; gst: string;
  bankAccountName: string; bankAccountNo: string; bankIfsc: string;
  bankName: string; bankBranch: string; bankSwift: string; directorId: string;
  printedBy: string;
  openAccessIndia: string; openAccessSaarc: string; openAccessOther: string;
  directorDeskTitle: string; directorDeskParagraphs: string;
  dispatchContactName: string; dispatchContactPhone: string; dispatchContactEmail: string;
  salesContactName: string; salesContactPhone: string; salesContactEmail: string;
};

export default function CompanyForm({ action, values, profiles, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  profiles: Option[];
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/companies">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text name="name" label="Company name" defaultValue={values?.name} required />
        <Text name="website" label="Website" defaultValue={values?.website} />
        <Text name="email" label="Email" type="email" defaultValue={values?.email} />
        <Text name="phone" label="Phone" defaultValue={values?.phone} />
        <Text name="cin" label="CIN" defaultValue={values?.cin} />
        <Text name="gst" label="GST" defaultValue={values?.gst} />
        <Text name="printedBy" label="Printed by (print vendor)" defaultValue={values?.printedBy} />
      </div>
      <ImageField
        name="logoUrl"
        label="Logo"
        defaultValue={values?.logoUrl}
        hint="Title-page logo. PNG with a transparent background (or SVG), landscape orientation. Recommended ≥ 600×400px, max ~2 MB."
      />
      <Select name="directorId" label="Director (profile)" defaultValue={values?.directorId} options={profiles} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Area name="registeredAddress" label="Registered address" defaultValue={values?.registeredAddress} rows={2} />
        <Area name="salesAddress" label="Sales address" defaultValue={values?.salesAddress} rows={2} />
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">Director&apos;s Desk (Page 7)</legend>
        <p className="mb-3 px-1 text-xs text-slate-500">
          Signed by the director profile selected above (name, role, photo &amp; signature come from that profile).
          One paragraph per line; use <code>{"{journal}"}</code> for the journal name.
        </p>
        <Text name="directorDeskTitle" label="Heading" defaultValue={values?.directorDeskTitle} placeholder="From the Director's Desk" />
        <Area name="directorDeskParagraphs" label="Message paragraphs" defaultValue={values?.directorDeskParagraphs} rows={6} />
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">Open Access charges (subscription page)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Text name="openAccessIndia" label="India" defaultValue={values?.openAccessIndia} placeholder="₹1500" />
          <Text name="openAccessSaarc" label="SAARC & African" defaultValue={values?.openAccessSaarc} placeholder="$100" />
          <Text name="openAccessOther" label="Other countries" defaultValue={values?.openAccessOther} placeholder="$200" />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">Page 5 contact boxes</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Text name="dispatchContactName" label="Dispatch contact" defaultValue={values?.dispatchContactName} />
          <Text name="dispatchContactPhone" label="Dispatch phone" defaultValue={values?.dispatchContactPhone} />
          <Text name="dispatchContactEmail" label="Dispatch e-mail" defaultValue={values?.dispatchContactEmail} />
          <Text name="salesContactName" label="Sales contact" defaultValue={values?.salesContactName} />
          <Text name="salesContactPhone" label="Sales phone" defaultValue={values?.salesContactPhone} />
          <Text name="salesContactEmail" label="Sales e-mail" defaultValue={values?.salesContactEmail} />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">Bank details</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Text name="bankAccountName" label="Account name" defaultValue={values?.bankAccountName} />
          <Text name="bankAccountNo" label="Account number" defaultValue={values?.bankAccountNo} />
          <Text name="bankName" label="Bank" defaultValue={values?.bankName} />
          <Text name="bankBranch" label="Branch" defaultValue={values?.bankBranch} />
          <Text name="bankIfsc" label="IFSC" defaultValue={values?.bankIfsc} />
          <Text name="bankSwift" label="SWIFT" defaultValue={values?.bankSwift} />
        </div>
      </fieldset>
    </EntityForm>
  );
}
