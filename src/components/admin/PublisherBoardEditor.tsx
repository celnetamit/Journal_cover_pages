import Link from "next/link";
import { addPublisherMember, removePublisherMember } from "@/app/actions/entities";
import { SearchableSelect, type Option } from "@/components/forms/Fields";

// Publisher-scoped management team. Only the two management roles apply here —
// this team is shared by every one of the publisher's journals' management page.
const ROLES: [string, string][] = [
  ["MANAGEMENT_HEAD", "Management Head (featured row)"],
  ["MANAGEMENT_MEMBER", "Management Member (grid)"],
];
const ROLE_LABEL = Object.fromEntries(ROLES);

export type PublisherBoardMember = { id: string; role: string; order: number; profileName: string };

const control =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

// Server component: manage the PublisherMember links for a publisher. Forms post
// to server actions which revalidate this page.
export default function PublisherBoardEditor({
  publisherId,
  members,
  profiles,
}: {
  publisherId: string;
  members: PublisherBoardMember[];
  profiles: Option[];
}) {
  return (
    <section className="mt-10 border-t border-slate-200 pt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Publication &amp; Management Team</h2>
          <p className="text-sm text-slate-500">
            Set this publisher&apos;s management team once here; it shows on every one of the publisher&apos;s
            journals&apos; management page (Head = featured row, Member = grid).{" "}
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
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400">No team members yet.</td></tr>
            )}
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-slate-700">{ROLE_LABEL[m.role] ?? m.role}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{m.profileName}</td>
                <td className="px-4 py-3 text-slate-500">{m.order}</td>
                <td className="px-4 py-3">
                  <form action={removePublisherMember} className="flex justify-end">
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="text-red-600 hover:text-red-700">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={addPublisherMember} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="publisherId" value={publisherId} />
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
          <select name="role" defaultValue="MANAGEMENT_MEMBER" className={`${control} mt-1`}>
            {ROLES.map(([value, text]) => (
              <option key={value} value={value}>{text}</option>
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
