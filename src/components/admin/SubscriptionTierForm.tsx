"use client";

import { EntityForm, Text, type FormState } from "@/components/forms/Fields";

type Values = {
  issuesPerYear: string;
  printInr: string; singleIssueInr: string; onlineInr: string; printOnlineInr: string;
  printUsd: string; onlineUsd: string; printOnlineUsd: string;
};

export default function SubscriptionTierForm({ action, values, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/subscription-pricing">
      <Text name="issuesPerYear" label="Issues per year" type="number" defaultValue={values?.issuesPerYear} required />
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">National (₹, India)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Text name="printInr" label="Print" type="number" defaultValue={values?.printInr} />
          <Text name="singleIssueInr" label="Single issue" type="number" defaultValue={values?.singleIssueInr} />
          <Text name="onlineInr" label="Online" type="number" defaultValue={values?.onlineInr} />
          <Text name="printOnlineInr" label="Print + Online" type="number" defaultValue={values?.printOnlineInr} />
        </div>
      </fieldset>
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">International ($, outside India)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Text name="printUsd" label="Print" type="number" defaultValue={values?.printUsd} />
          <Text name="onlineUsd" label="Online" type="number" defaultValue={values?.onlineUsd} />
          <Text name="printOnlineUsd" label="Online + Print" type="number" defaultValue={values?.printOnlineUsd} />
        </div>
      </fieldset>
    </EntityForm>
  );
}
