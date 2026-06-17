import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type Role,
  type SessionPayload,
} from "@/lib/auth/jwt";

export type { Role, SessionPayload };

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Read + verify the current session from the cookie. Memoized per render pass.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return decryptSession(token);
});

// Require any authenticated user; redirect to /login otherwise.
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

const RANK: Record<Role, number> = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };

export function hasRole(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

// Require at least `min` role; redirect unauthenticated to /login and
// under-privileged users to the home page.
export async function requireRole(min: Role): Promise<SessionPayload> {
  const session = await requireSession();
  if (!hasRole(session.role, min)) redirect("/");
  return session;
}

export const canEdit = (role: Role) => hasRole(role, "EDITOR");
export const isAdmin = (role: Role) => role === "ADMIN";
