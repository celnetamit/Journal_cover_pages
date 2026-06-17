"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUser,
  deleteUser,
  resetPassword,
  setUserActive,
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
};

const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export default function UserManager({
  currentUserId,
  users,
}: {
  currentUserId: string;
  users: Row[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className={u.active ? "" : "bg-slate-50/60"}>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
