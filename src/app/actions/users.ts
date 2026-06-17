"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth/session";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

const CreateSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(ROLES),
});

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = CreateSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with that email already exists." };

  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name || null,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserRole(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (!ROLES.includes(role as (typeof ROLES)[number])) return;

  const session = await getSession();
  // Don't let an admin strip their own admin role (avoid lockout).
  if (session?.userId === id && role !== "ADMIN") return;

  await prisma.user.update({ where: { id }, data: { role: role as (typeof ROLES)[number] } });
  revalidatePath("/admin/users");
}

export async function setUserActive(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";

  const session = await getSession();
  if (session?.userId === id && !active) return; // can't disable yourself

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/admin/users");
}

const ResetSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = ResetSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });
  return { ok: true };
}

export async function deleteUser(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const session = await getSession();
  if (session?.userId === id) return; // can't delete yourself

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
