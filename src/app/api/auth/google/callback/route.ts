import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  encryptSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type Role,
} from "@/lib/auth/jwt";
import {
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  googleConfigured,
  googleRedirectUri,
  isAdminEmail,
  resolveAccess,
} from "@/lib/auth/google";

function fail(origin: string, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

// Handle Google's redirect back: verify state, exchange the code, look up the
// profile, enforce the domain/admin policy, then mint a session.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;

  if (!googleConfigured()) return fail(origin, "google_unconfigured");

  const error = searchParams.get("error");
  if (error) return fail(origin, "google_denied");

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail(origin, "google_state");
  }

  // 1. Exchange the authorization code for an access token.
  let accessToken: string;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(origin),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail(origin, "google_token");
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return fail(origin, "google_token");
    accessToken = token.access_token;
  } catch {
    return fail(origin, "google_token");
  }

  // 2. Fetch the user's profile.
  let profile: { email?: string; email_verified?: boolean; name?: string };
  try {
    const infoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) return fail(origin, "google_profile");
    profile = await infoRes.json();
  } catch {
    return fail(origin, "google_profile");
  }

  const email = profile.email?.toLowerCase();
  if (!email || profile.email_verified === false) return fail(origin, "google_email");

  // 3. Enforce the access policy (admin email, or allow-listed domain).
  const access = await resolveAccess(email);
  if (!access.allowed) return fail(origin, "domain_not_allowed");

  // 4. Find-or-create the account. Admin emails are promoted + reactivated;
  // OAuth-created users get an unusable random password hash.
  const existing = await prisma.user.findUnique({ where: { email } });
  let user = existing;
  if (existing) {
    if (!existing.active && !isAdminEmail(email)) return fail(origin, "account_disabled");
    if (isAdminEmail(email) && (existing.role !== "ADMIN" || !existing.active)) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", active: true },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name ?? null,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        role: access.role,
        active: true,
      },
    });
  }

  if (!user) return fail(origin, "google_profile");

  // 5. Mint the session and redirect to the original destination.
  const token = await encryptSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  const next = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const response = NextResponse.redirect(new URL(safeNext, origin));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}
