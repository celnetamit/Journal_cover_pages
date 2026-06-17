import { NextResponse } from "next/server";
import { getSession, canEdit } from "@/lib/auth/session";
import { listBinders, saveBinder } from "@/lib/binder-store";
import type { BinderDraft } from "@/lib/binder-content";

type Params = { params: Promise<{ id: string }> };

// List all issues (binders) of a journal.
export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  return NextResponse.json({ binders: await listBinders(id) });
}

// Save a draft for a journal. Body: { draft, baseUpdatedAt?, binderId? }.
export async function PUT(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (!canEdit(session.role)) return new NextResponse(null, { status: 403 });

  const { id } = await params;
  let body: { draft?: BinderDraft; baseUpdatedAt?: string; binderId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.draft || typeof body.draft !== "object") {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }

  const result = await saveBinder(id, body.draft, body.baseUpdatedAt, body.binderId, session.userId);
  if (result.status === "conflict") return NextResponse.json(result, { status: 409 });
  if (result.status === "error") return NextResponse.json(result, { status: 422 });
  return NextResponse.json(result);
}
