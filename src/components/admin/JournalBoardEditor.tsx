import Link from "next/link";
import { addJournalMember, removeJournalMember } from "@/app/actions/entities";
import { SearchableSelect, type Option } from "@/components/forms/Fields";

// Grouped by the binder page the role feeds, so it's clear what each choice maps
// to. Editorial-page roles split into the page's Editor-in-Chief / Associate /
// Editors sections by their label; management roles feed the Management page.
const ROLE_GROUPS: { label: string; roles: [string, string][] }[] = [
  {
    label: "Editorial page",
    roles: [
      ["EDITOR_IN_CHIEF", "Editor-in-Chief"],
      ["ASSOCIATE_EDITOR_IN_CHIEF", "Associate Editor-in-Chief"],
      ["EDITORIAL_BOARD", "Editorial Board"],
      ["MANAGING_EDITOR", "Managing Editor"],
      ["ADVISOR", "Advisor"],
      ["REVIEWER", "Reviewer"],
    ],
  },
  {
    label: "Management page",
    roles: [
      ["MANAGEMENT_HEAD", "Management Head"],
      ["MANAGEMENT_MEMBER", "Management Member"],
    ],
  },
];
const ROLE_LABEL = Object.fromEntries(ROLE_GROUPS.flatMap((g) => g.roles));

export type BoardMember = { id: string; role: string; order: number; profileName: string };

const control =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

// Server component: manage the JournalMember links for a journal. Forms post to
// server actions which revalidate this page.
export default function JournalBoardEditor({
  journalId,
  members,
  profiles,
}: {
  journalId: string;
  members: BoardMember[];
  profiles: Option[];
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Board &amp; team</h2>
          <p className="text-sm text-slate-500">
            Select a profile + role; the role decides the binder page and section it appears in
            (Editor-in-Chief / Associate / Editors on the Editorial page; Head / Member on the Management page).{" "}
            <Link href="/admin/profiles/new" className="text-slate-700 underline">Add a new profile</Link>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Person</th>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400">No members yet.</td></tr>
            )}
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-slate-700">{ROLE_LABEL[m.role] ?? m.role}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{m.profileName}</td>
                <td className="px-4 py-3 text-slate-500">{m.order}</td>
                <td className="px-4 py-3">
                  <form action={removeJournalMember} className="flex justify-end">
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="text-red-600 hover:text-red-700">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={addJournalMember} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="journalId" value={journalId} />
        <div className="flex-1">
          <SearchableSelect
            name="profileId"
            label="Person"
            options={profiles}
            placeholder="Search a profile by name…"
          />
        </div>
        <label>
          <span className="block text-xs text-slate-500">Role</span>
          <select name="role" defaultValue="EDITORIAL_BOARD" className={`${control} mt-1`}>
            {ROLE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.roles.map(([value, text]) => (
                  <option key={value} value={value}>{text}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-xs text-slate-500">Order</span>
          <input name="order" type="number" defaultValue={members.length} className={`${control} mt-1 w-20`} />
        </label>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Add
        </button>
      </form>
    </section>
  );
}
