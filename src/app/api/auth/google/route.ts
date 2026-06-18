import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_AUTH_URL,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  googleClientId,
  googleConfigured,
  googleRedirectUri,
  publicOrigin,
} from "@/lib/auth/google";

// Start the Google OAuth flow: stash a CSRF `state` + desired post-login path in
// short-lived cookies, then redirect to Google's consent screen.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = publicOrigin(request);

  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_unconfigured", origin));
  }

  const rawNext = searchParams.get("next") ?? "/";
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const state = crypto.randomUUID();

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", googleClientId()!);
  authUrl.searchParams.set("redirect_uri", googleRedirectUri(origin));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOpts);
  response.cookies.set(OAUTH_NEXT_COOKIE, safeNext, cookieOpts);
  return response;
}
