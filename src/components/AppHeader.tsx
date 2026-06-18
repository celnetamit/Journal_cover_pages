import Link from "next/link";
import Logo from "@/components/Logo";
import { getSession, isAdmin, canEdit } from "@/lib/auth/session";
import { logout } from "@/app/actions/auth";

// Server component. Renders nothing when signed out (e.g. on /login).
export default async function AppHeader() {
  const session = await getSession();
  if (!session) return null;

  const label = session.name || session.email;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-sm">
      <Link href="/" className="-my-1" aria-label="Journal Builder home">
        <Logo size={26} />
      </Link>
      <nav className="flex items-center gap-4">
        {canEdit(session.role) && (
          <>
            <Link href="/journals" className="text-slate-600 hover:text-slate-900">
              Journals
            </Link>
            <Link href="/admin" className="text-slate-600 hover:text-slate-900">
              Setup
            </Link>
          </>
        )}
        {isAdmin(session.role) && (
          <Link href="/admin/users" className="text-slate-600 hover:text-slate-900">
            Users
          </Link>
        )}
        <span className="text-slate-500">
          {label}
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-600">
            {session.role}
          </span>
        </span>
        <form action={logout}>
          <button type="submit" className="text-slate-600 hover:text-slate-900">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
