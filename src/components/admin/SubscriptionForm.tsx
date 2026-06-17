"use client";

import { EntityForm, Text, NativeSelect, type FormState } from "@/components/forms/Fields";

type Values = { name: string; mode: string; priceUsd: string; priceInr: string };

export default function SubscriptionForm({ action, values, submitLabel }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  values?: Partial<Values>;
  submitLabel: string;
}) {
  return (
    <EntityForm action={action} submitLabel={submitLabel} cancelHref="/admin/subscriptions">
      <Text name="name" label="Plan name" defaultValue={values?.name} required />
      <NativeSelect
        name="mode"
        label="Mode"
        defaultValue={values?.mode ?? "PRINT_ONLINE"}
        options={[["PRINT", "Print"], ["ONLINE", "Online"], ["PRINT_ONLINE", "Print + Online"]]}
      />
      <div className="grid grid-cols-2 gap-4">
        <Text name="priceUsd" label="Price (USD)" type="number" defaultValue={values?.priceUsd} />
        <Text name="priceInr" label="Price (INR)" type="number" defaultValue={values?.priceInr} />
      </div>
    </EntityForm>
  );
}
