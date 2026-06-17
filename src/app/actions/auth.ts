"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/jwt";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (!user) {
    // Burn comparable time so a missing user isn't distinguishable by timing.
    await bcrypt.hash(password, 10);
    return { error: "Incorrect email or password." };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "Incorrect email or password." };
  if (!user.active) return { error: "This account is disabled." };

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  // Honor a safe relative `next` path; ignore absolute/protocol-relative URLs.
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
