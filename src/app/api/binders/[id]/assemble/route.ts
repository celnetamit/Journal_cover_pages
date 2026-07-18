import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireBinderAccess } from "@/lib/binder-guard";
import { prisma } from "@/lib/prisma";
import { assembleBinder } from "@/lib/binder-files";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// Merge the front-matter PDF + every article's manuscript (in TOC order) into
// the final binder PDF. Replaces any previous assembly, which invalidates the
// pass verdict of QA runs made against it. Blocked while in internal review.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const access = await requireBinderAccess(session, id, { write: true });
  if (!access.ok) return access.response;

  const result = await assembleBinder(id, session!.userId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  const issue = await prisma.binder.findUnique({ where: { id }, select: { volume: true, issue: true, year: true } });
  await logAudit({
    action: "binder.assemble",
    actor: session!,
    targetType: "Binder",
    targetId: id,
    targetName: access.binder.journal.name,
    summary: `Assembled binder PDF (Vol ${issue?.volume ?? "?"} Issue ${issue?.issue ?? "?"} ${issue?.year ?? ""}) — ${result.pageCount} pages.`,
  });

  return NextResponse.json({ fileId: result.fileId, pageCount: result.pageCount, meta: result.meta });
}
