"use client";

import { Fragment, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inlineToPlainText } from "@/lib/rich-text";
import {
  createUser,
  deleteUser,
  resetPassword,
  setUserActive,
  setUserJournals,
  setUserRole,
  type ActionState,
} from "@/app/actions/users";

type Row = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  createdAt: string;
  managedJournalIds: string[];
};

type JournalOption = { id: string; name: string };

const ROLES = ["ADMIN", "EDITOR", "JOURNAL_MANAGER", "VIEWER"] as const;

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export default function UserManager({
  currentUserId,
  users,
  journals,
}: {
  currentUserId: string;
  users: Row[];
  journals: JournalOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  // Which user's journal-assignment panel is open, and its working selection.
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? users.filter((u) => `${u.name ?? ""} ${u.email} ${u.role}`.toLowerCase().includes(q))
      : users;
  }, [query, users]);
  const [state, addAction, adding] = useActionState<ActionState, FormData>(createUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  function run(action: (fd: FormData) => Promise<void>, fd: FormData) {
    startTransition(async () => {
      await action(fd);
      router.refresh();
    });
  }

  function changeRole(id: string, role: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("role", role);
    run(setUserRole, fd);
  }

  function openAssign(u: Row) {
    if (assignFor === u.id) {
      setAssignFor(null);
      return;
    }
    setAssignFor(u.id);
    setSelected(new Set(u.managedJournalIds));
  }

  function toggleJournal(journalId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(journalId)) next.delete(journalId);
      else next.add(journalId);
      return next;
    });
  }

  function saveAssign(userId: string) {
    const fd = new FormData();
    fd.set("id", userId);
    selected.forEach((jid) => fd.append("journalIds", jid));
    startTransition(async () => {
      await setUserJournals(fd);
      setAssignFor(null);
      router.refresh();
    });
  }

  function toggleActive(id: string, active: boolean) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("active", String(active));
    run(setUserActive, fd);
  }

  function remove(id: string) {
    if (!confirm("Delete this user permanently?")) return;
    const fd = new FormData();
    fd.set("id", id);
    run(deleteUser, fd);
  }

  function reset(id: string) {
    const password = prompt("New password (min 8 characters):");
    if (!password) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("password", password);
    startTransition(async () => {
      const result = await resetPassword(undefined, fd);
      alert(result?.error ?? "Password updated.");
    });
  }

  return (
    <div className="space-y-8">
      {/* Add user */}
      <form
        ref={formRef}
        action={addAction}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-5"
      >
        <input name="name" placeholder="Name" className={`${inputClass} sm:col-span-1`} />
        <input name="email" type="email" required placeholder="Email" className={`${inputClass} sm:col-span-2`} />
        <input name="password" type="password" required placeholder="Password" className={inputClass} />
        <div className="flex gap-2">
          <select name="role" defaultValue="EDITOR" className={`${inputClass} flex-1`}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        {state?.error && (
          <p className="sm:col-span-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
      </form>

      {/* User list */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users…"
        className={`${inputClass} w-full`}
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const isSelf = u.id === currentUserId;
              const isManager = u.role === "JOURNAL_MANAGER";
              return (
                <Fragment key={u.id}>
                <tr className={u.active ? "" : "bg-slate-50/60"}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.name || "—"}</div>
                    <div className="text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={isPending || (isSelf && u.role === "ADMIN")}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className={`${inputClass} py-1`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.active ? (
                      <span className="text-emerald-600">Active</span>
                    ) : (
                      <span className="text-slate-400">Disabled</span>
                    )}
                    {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-sm">
                      {isManager && (
                        <button
                          onClick={() => openAssign(u)}
                          disabled={isPending}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Journals ({u.managedJournalIds.length})
                        </button>
                      )}
                      <button onClick={() => reset(u.id)} disabled={isPending} className="text-slate-600 hover:text-slate-900">
                        Reset password
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => toggleActive(u.id, !u.active)}
                          disabled={isPending}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {u.active ? "Disable" : "Enable"}
                        </button>
                      )}
                      {!isSelf && (
                        <button onClick={() => remove(u.id)} disabled={isPending} className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {isManager && assignFor === u.id && (
                  <tr className="bg-slate-50/60">
                    <td colSpan={4} className="px-4 py-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Assigned journals — {u.name || u.email}
                        </span>
                        <span className="text-xs text-slate-500">{selected.size} selected</span>
                      </div>
                      {journals.length === 0 ? (
                        <p className="text-sm text-slate-500">No journals exist yet.</p>
                      ) : (
                        <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-2">
                          {journals.map((j) => (
                            <label key={j.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={selected.has(j.id)}
                                onChange={() => toggleJournal(j.id)}
                              />
                              <span>{inlineToPlainText(j.name)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => saveAssign(u.id)}
                          disabled={isPending}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          Save assignments
                        </button>
                        <button
                          onClick={() => setAssignFor(null)}
                          disabled={isPending}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
