import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEditBinders, type SessionPayload } from "@/lib/auth/session";
import { canManageJournal } from "@/lib/journal-access";

// Single authorization gate for every binder-scoped API route. Centralizing it
// keeps the session → role → binder → journal-ownership sequence identical
// everywhere and enforces the review lock SERVER-SIDE: once a binder is with
// the internal review team, its QA files/assembly/runs are frozen — the UI
// disables the buttons, but this is what actually stops a direct request.

export type GuardedBinder = {
  id: string;
  journalId: string;
  reviewStatus: "DRAFT" | "IN_INTERNAL_REVIEW";
  journal: { name: string };
};

export type BinderAccessResult =
  | { ok: true; binder: GuardedBinder }
  | { ok: false; response: NextResponse };

export async function requireBinderAccess(
  session: SessionPayload | null,
  binderId: string,
  opts: { write: boolean },
): Promise<BinderAccessResult> {
  if (!session) return { ok: false, response: new NextResponse(null, { status: 401 }) };
  if (opts.write && !canEditBinders(session.role)) {
    return { ok: false, response: new NextResponse(null, { status: 403 }) };
  }
  const binder = await prisma.binder.findUnique({
    where: { id: binderId },
    select: { id: true, journalId: true, reviewStatus: true, journal: { select: { name: true } } },
  });
  if (!binder) {
    return { ok: false, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  if (!(await canManageJournal(session, binder.journalId))) {
    return { ok: false, response: new NextResponse(null, { status: 403 }) };
  }
  if (opts.write && binder.reviewStatus === "IN_INTERNAL_REVIEW") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This binder is with the internal review team — return it to draft before changing its files or re-running QA." },
        { status: 409 },
      ),
    };
  }
  return { ok: true, binder };
}
