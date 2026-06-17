import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

const MAX_BYTES = 15 * 1024 * 1024;

// Block loopback / private / link-local hosts to limit SSRF.
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "0.0.0.0" || h === "::1" || h.endsWith(".localhost")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true; // IPv6 private/link-local
  return false;
}

// Same-origin image proxy. Authenticated only (not an open proxy), restricted to
// http(s) image responses from non-internal hosts. Used to make remote journal
// cover/logo URLs exportable via html2canvas.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const raw = new URL(req.url).searchParams.get("url");
  if (!raw) return new NextResponse(null, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") return new NextResponse(null, { status: 400 });
  if (isBlockedHost(target.hostname)) return new NextResponse(null, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { redirect: "follow", headers: { Accept: "image/*" } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
  if (!upstream.ok) return new NextResponse(null, { status: 502 });

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) return new NextResponse(null, { status: 415 });

  const bytes = Buffer.from(await upstream.arrayBuffer());
  if (bytes.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
