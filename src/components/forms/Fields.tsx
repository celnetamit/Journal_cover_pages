"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";

export type FormState = { error?: string } | undefined;
export type Option = { id: string; label: string };

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
const labelClass = "block text-sm font-medium text-slate-700";

export function Text({ name, label, defaultValue, type = "text", required = false, placeholder }: {
  name: string; label: string; defaultValue?: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} className={inputClass} />
    </label>
  );
}

export function Area({ name, label, defaultValue, rows = 3, hint }: {
  name: string; label: string; defaultValue?: string; rows?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea name={name} rows={rows} defaultValue={defaultValue} className={inputClass} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Select({ name, label, defaultValue, options, placeholder = "— none —" }: {
  name: string; label: string; defaultValue?: string; options: Option[]; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={inputClass}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// Select over a fixed set of value/label pairs (no empty option).
export function NativeSelect({ name, label, defaultValue, options }: {
  name: string; label: string; defaultValue?: string; options: [string, string][];
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </label>
  );
}

// Image field: a URL input that can be filled by uploading a file to /api/assets.
export function ImageField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue?: string; hint?: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/assets", { method: "POST", body: form });
      if (!res.ok) {
        setError(res.status === 403 ? "Read-only access — upload disabled." : "Upload failed.");
        return;
      }
      const data = (await res.json()) as { url: string };
      setUrl(data.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="h-10 w-10 rounded border border-slate-200 object-contain" /> : null}
        <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Image URL or upload →" className={inputClass} />
        <input type="file" accept="image/*" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="text-xs" />
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

// Standard create/edit form shell: wires a server action via useActionState and
// renders submit + cancel + error.
export function EntityForm({
  action,
  submitLabel,
  cancelHref,
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  cancelHref: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);
  return (
    <form action={formAction} className="space-y-6">
      {children}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
      </div>
    </form>
  );
}
