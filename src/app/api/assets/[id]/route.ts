import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// Serve image bytes from the Asset table. Public + immutable: asset content
// never changes (a new upload creates a new id), so it is safe to cache hard.
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const grayscale = new URL(req.url).searchParams.get("grayscale") === "1";

  // Cheap revalidation: the id is the ETag, so a matching request returns 304.
  if (req.headers.get("if-none-match") === `"${id}"`) {
    return new Response(null, { status: 304 });
  }

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return new Response(null, { status: 404 });

  let bytes: Buffer = Buffer.from(asset.data);
  if (grayscale) {
    const { default: sharp } = await import("sharp");
    bytes = Buffer.from(await sharp(bytes).grayscale().toBuffer());
  }

  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: `"${asset.id}"`,
      // Defense-in-depth for user-uploaded files (e.g. an SVG containing a
      // <script>): renders fine via <img>, but if opened/embedded as a document
      // the sandbox blocks scripts and nosniff blocks content-type confusion.
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
