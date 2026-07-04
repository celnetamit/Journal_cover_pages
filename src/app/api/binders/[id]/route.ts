import { NextResponse } from "next/server";
import { getSession, canEditBinders } from "@/lib/auth/session";
import { canManageJournal } from "@/lib/journal-access";
import { prisma } from "@/lib/prisma";
import { deleteBinder, getBinderById } from "@/lib/binder-store";

type Params = { params: Promise<{ id: string }> };

// Fetch a specific issue's draft + metadata.
export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const stored = await getBinderById(id);
  if (!stored) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(stored);
}

// Delete an issue.
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (!canEditBinders(session.role)) return new NextResponse(null, { status: 403 });
  const { id } = await params;
  const binder = await prisma.binder.findUnique({ where: { id }, select: { journalId: true } });
  if (!binder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // A journal manager may only delete issues of journals assigned to them.
  if (!(await canManageJournal(session, binder.journalId))) return new NextResponse(null, { status: 403 });
  await deleteBinder(id);
  return NextResponse.json({ ok: true });
}
