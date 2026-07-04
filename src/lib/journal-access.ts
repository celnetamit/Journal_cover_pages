import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, type SessionPayload } from "@/lib/auth/session";

// Which journals the current user may edit.
//   "ALL"  → editors and admins (no restriction)
//   Set    → a JOURNAL_MANAGER's assigned journal ids (may be empty)
//   empty  → viewers (no edit access)
export async function assignedJournalIds(
  session: SessionPayload,
): Promise<Set<string> | "ALL"> {
  if (session.role === "ADMIN" || session.role === "EDITOR") return "ALL";
  if (session.role === "JOURNAL_MANAGER") {
    const rows = await prisma.journal.findMany({
      where: { managerUsers: { some: { id: session.userId } } },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  }
  return new Set();
}

export async function canManageJournal(
  session: SessionPayload,
  journalId: string,
): Promise<boolean> {
  const ids = await assignedJournalIds(session);
  return ids === "ALL" || ids.has(journalId);
}

// Guard for journal-record editing (edit page + updateJournal action). Admits
// editors/admins for any journal and a journal manager only for an assigned one;
// everyone else is redirected home.
export async function requireJournalManageAccess(
  journalId: string,
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!(await canManageJournal(session, journalId))) redirect("/");
  return session;
}
