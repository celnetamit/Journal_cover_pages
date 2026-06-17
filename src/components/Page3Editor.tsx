"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveJournalCompany, saveJournalPrices, type Page3State } from "@/app/actions/page3";
import type { LegalInfo } from "@/lib/legal-data";

const input =
  "rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300";

// Inline Page-3 editor in the builder. Writes to the SHARED Company record and
// the journal's per-plan subscription prices, then refreshes so the live preview
// updates. (These changes affect every issue of the journal.)
export default function Page3Editor({ journalId, legal }: { journalId: string; legal: LegalInfo | undefined }) {
  const router = useRouter();

  if (!legal?.companyId) {
    return (
      <div className="editor-note">
        Link a publisher (with a company) to this journal under <b>Journals → Edit</b> to edit the
        subscription prices and company/payment details here.
      </div>
    );
  }

  return (
    <div className="page3-editor">
      <div className="editor-note">
        These update the journal&apos;s <b>company &amp; pricing</b> in the database — shared across all issues of this journal.
        Use the full-text override below for one-off, issue-specific wording.
      </div>
      <PricesForm journalId={journalId} legal={legal} onSaved={() => router.refresh()} />
      <CompanyForm legal={legal} onSaved={() => router.refresh()} />
    </div>
  );
}

function PricesForm({ journalId, legal, onSaved }: { journalId: string; legal: LegalInfo; onSaved: () => void }) {
  const [state, action, pending] = useActionState<Page3State, FormData>(
    saveJournalPrices.bind(null, journalId),
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="page3-card">
      <div className="editor-row-head"><span>Subscription prices</span></div>
      {legal.plans.length === 0 ? (
        <p className="editor-note">No subscription plans yet. Add them under Setup → Subscriptions.</p>
      ) : (
        <table className="page3-price-table">
          <thead>
            <tr><th>Plan</th><th>INR (national)</th><th>USD (international)</th></tr>
          </thead>
          <tbody>
            {legal.plans.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><input name={`inr_${p.id}`} type="number" step="0.01" defaultValue={p.priceInr ?? ""} className={input} /></td>
                <td><input name={`usd_${p.id}`} type="number" step="0.01" defaultValue={p.priceUsd ?? ""} className={input} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="page3-actions">
        <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save prices"}</button>
        {state?.ok && <span className="page3-ok">Saved</span>}
        {state?.error && <span className="page3-err">{state.error}</span>}
      </div>
    </form>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="page3-field">
      <span>{label}</span>
      <input name={name} defaultValue={defaultValue ?? ""} className={input} />
    </label>
  );
}

function CompanyForm({ legal, onSaved }: { legal: LegalInfo; onSaved: () => void }) {
  const [state, action, pending] = useActionState<Page3State, FormData>(
    saveJournalCompany.bind(null, legal.companyId),
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="page3-card">
      <div className="editor-row-head"><span>Company &amp; payment details</span></div>
      <div className="page3-grid">
        <Field name="name" label="Company name" defaultValue={legal.companyName} />
        <Field name="phone" label="Phone" defaultValue={legal.phone} />
        <Field name="email" label="Email" defaultValue={legal.email} />
        <Field name="cin" label="CIN" defaultValue={legal.cin} />
        <Field name="gst" label="GST" defaultValue={legal.gst} />
      </div>
      <label className="page3-field">
        <span>Registered address (used for &ldquo;send DD/cheque to&rdquo;)</span>
        <textarea name="registeredAddress" rows={2} defaultValue={legal.registeredAddress} className={input} />
      </label>
      <label className="page3-field">
        <span>Sales / marketing address</span>
        <textarea name="salesAddress" rows={2} defaultValue={legal.salesAddress} className={input} />
      </label>
      <div className="editor-row-head"><span>Bank details</span></div>
      <div className="page3-grid">
        <Field name="bankAccountName" label="Account name" defaultValue={legal.bankAccountName} />
        <Field name="bankAccountNo" label="Account number" defaultValue={legal.bankAccountNo} />
        <Field name="bankName" label="Bank" defaultValue={legal.bankName} />
        <Field name="bankBranch" label="Branch" defaultValue={legal.bankBranch} />
        <Field name="bankIfsc" label="IFSC" defaultValue={legal.bankIfsc} />
        <Field name="bankSwift" label="SWIFT" defaultValue={legal.bankSwift} />
      </div>
      <div className="page3-actions">
        <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save company & payment details"}</button>
        {state?.ok && <span className="page3-ok">Saved</span>}
        {state?.error && <span className="page3-err">{state.error}</span>}
      </div>
    </form>
  );
}
