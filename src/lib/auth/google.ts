import "server-only";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth/jwt";

// Manual Google OAuth2 (authorization-code) flow — keeps the app's DIY jose
// session model instead of pulling in Auth.js. Only used from route handlers.

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const OAUTH_STATE_COOKIE = "g_oauth_state";
export const OAUTH_NEXT_COOKIE = "g_oauth_next";
export const OAUTH_COOKIE_MAX_AGE = 60 * 10; // 10 minutes to complete the round-trip

export function googleClientId(): string | undefined {
  return process.env.GOOGLE_CLIENT_ID || undefined;
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// Emails that are always admins and bypass the domain allow-list. Defaults to
// amit.rai@celnet.in; override/extend via GOOGLE_ADMIN_EMAILS (comma-separated).
export function adminEmails(): string[] {
  const fromEnv = (process.env.GOOGLE_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const set = new Set<string>(["amit.rai@celnet.in", ...fromEnv]);
  return [...set];
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.toLowerCase());
}

export function emailDomain(email: string): string {
  return email.toLowerCase().split("@")[1] ?? "";
}

// The callback URI must exactly match one registered in the Google Cloud OAuth
// client. Derived from the request origin so it works across localhost/prod.
export function googleRedirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

export type GoogleProfile = {
  email: string;
  emailVerified: boolean;
  name: string | null;
};

// Decide whether an email may sign in, and with what role. Admin emails are
// always allowed (ADMIN); everyone else must match an AllowedDomain (VIEWER).
export async function resolveAccess(
  email: string,
): Promise<{ allowed: true; role: Role } | { allowed: false }> {
  if (isAdminEmail(email)) return { allowed: true, role: "ADMIN" };
  const domain = emailDomain(email);
  if (!domain) return { allowed: false };
  const match = await prisma.allowedDomain.findUnique({ where: { domain } });
  return match ? { allowed: true, role: "VIEWER" } : { allowed: false };
}
