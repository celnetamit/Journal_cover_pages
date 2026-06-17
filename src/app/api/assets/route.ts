import { NextResponse } from "next/server";
import { getSession, canEdit } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

// Upload an image; bytes are stored in the Asset table. Returns its serve URL.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  if (!canEdit(session.role)) return new NextResponse(null, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds 8 MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const asset = await prisma.asset.create({
    data: {
      data: bytes,
      mimeType: file.type,
      byteSize: bytes.length,
      uploadedById: session.userId,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: asset.id, url: `/api/assets/${asset.id}` });
}
