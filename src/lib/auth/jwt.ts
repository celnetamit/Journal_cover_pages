import { SignJWT, jwtVerify } from "jose";

// Roles mirror the Prisma UserRole enum. Kept as a local union so this module
// stays free of the Prisma client (it is imported by proxy.ts on every request).
export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
};

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function key(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: (payload.name as string | null) ?? null,
        role: payload.role as Role,
      };
    }
    return null;
  } catch {
    return null;
  }
}
