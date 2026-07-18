import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireBinderAccess } from "@/lib/binder-guard";
import { listBinderFiles, saveBinderFile, deleteBinderFile } from "@/lib/binder-files";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// List the QA files (front matter, cover, manuscripts, assembled binder).
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const access = await requireBinderAccess(await getSession(), id, { write: false });
  if (!access.ok) return access.response;
  return NextResponse.json({ files: await listBinderFiles(id) });
}

// Upload a PDF. Form fields: file, kind (FRONT_MATTER | MANUSCRIPT | COVER), articleId?
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const access = await requireBinderAccess(session, id, { write: true });
  if (!access.ok) return access.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = form.get("kind");
  const articleId = form.get("articleId");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (kind !== "FRONT_MATTER" && kind !== "MANUSCRIPT" && kind !== "COVER") {
    return NextResponse.json({ error: "Invalid file kind" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "PDF exceeds 50 MB" }, { status: 413 });
  }

  const result = await saveBinderFile({
    binderId: id,
    kind,
    articleId: typeof articleId === "string" && articleId ? articleId : null,
    filename: file.name || null,
    bytes: Buffer.from(await file.arrayBuffer()),
    userId: session!.userId,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ file: result.file });
}

// Remove a file: DELETE ?fileId=...
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const access = await requireBinderAccess(await getSession(), id, { write: true });
  if (!access.ok) return access.response;

  const fileId = new URL(req.url).searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  const removed = await deleteBinderFile(fileId, id);
  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
