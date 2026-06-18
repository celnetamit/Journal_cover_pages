"use client";

import { useActionState } from "react";
import { addAllowedDomain, removeAllowedDomain } from "@/app/actions/entities";
import type { FormState } from "@/app/actions/entities";

type AllowedDomain = { id: string; domain: string };

export default function AllowedDomainManager({ domains }: { domains: AllowedDomain[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addAllowedDomain, undefined);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <form action={action} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="domain" className="block text-sm font-medium text-slate-700">
              Add a domain
            </label>
            <input
              // Remount (clearing the field) whenever the list size changes — i.e. after a successful add.
              key={domains.length}
              id="domain"
              name="domain"
              placeholder="e.g. celnet.in"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add domain"}
          </button>
        </form>
        {state?.error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Anyone with a Google account on an allowed domain can sign in (created as VIEWER). Configured
          admin emails are always admins and bypass this list.
        </p>
      </div>

      {domains.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">No domains yet — no one can self-onboard via Google.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {domains.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-mono text-sm text-slate-800">{d.domain}</span>
              <form action={removeAllowedDomain}>
                <input type="hidden" name="id" value={d.id} />
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
