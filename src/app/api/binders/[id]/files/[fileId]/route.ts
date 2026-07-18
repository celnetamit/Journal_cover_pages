import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireBinderAccess } from "@/lib/binder-guard";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; fileId: string }> };

// Serve a stored binder PDF (view/download). Authorization runs on metadata
// only — the multi-MB bytes column is fetched only after access is granted.
export async function GET(_req: Request, { params }: Params) {
  const { id, fileId } = await params;
  const access = await requireBinderAccess(await getSession(), id, { write: false });
  if (!access.ok) return access.response;

  const file = await prisma.binderFile.findUnique({
    where: { id: fileId },
    select: { binderId: true, filename: true, byteSize: true },
  });
  if (!file || file.binderId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await prisma.binderFile.findUnique({ where: { id: fileId }, select: { data: true } });
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(bytes.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.byteSize),
      "Content-Disposition": `inline; filename="${(file.filename ?? "binder.pdf").replace(/[^\w.\- ]/g, "_")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
