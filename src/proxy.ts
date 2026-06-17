import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/auth/jwt";

// Next.js 16 renamed Middleware to Proxy (same functionality, Node.js runtime).
// This performs an optimistic auth gate: unauthenticated users are sent to
// /login; authenticated users are kept off /login. Authorization for specific
// roles is enforced again server-side (pages, actions, route handlers).

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);

  if (!session && !isPublic) {
    const url = new URL("/login", request.nextUrl);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API auth, Next internals, and static asset files.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)$).*)"],
};
