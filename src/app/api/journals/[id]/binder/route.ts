import { NextResponse } from "next/server";
import { getSession, canEdit } from "@/lib/auth/session";
import { getJournalDraft, saveJournalDraft } from "@/lib/binder-store";
import type { BinderDraft } from "@/lib/binder-content";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const stored = await getJournalDraft(id);
  return NextResponse.json(stored ?? { draft: null });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (!canEdit(session.role)) return new NextResponse(null, { status: 403 });

  const { id } = await params;
  let body: { draft?: BinderDraft; baseUpdatedAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.draft || typeof body.draft !== "object") {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }

  const result = await saveJournalDraft(id, body.draft, body.baseUpdatedAt, session.userId);
  if (result.status === "conflict") {
    return NextResponse.json(result, { status: 409 });
  }
  return NextResponse.json(result);
}
