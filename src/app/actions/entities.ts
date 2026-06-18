"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

export type FormState = { error?: string } | undefined;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const nul = (v: string) => (v.length ? v : null);
const rel = (id: string) => (id ? { connect: { id } } : undefined);
const relOrClear = (id: string) => (id ? { connect: { id } } : { disconnect: true });

function isUniqueError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// --- Profile --------------------------------------------------------------

const ProfileSchema = z.object({ name: z.string().trim().min(1, "Name is required.") });

function profileData(fd: FormData) {
  return {
    name: str(fd.get("name")),
    email: nul(str(fd.get("email"))),
    designation: nul(str(fd.get("designation"))),
    department: nul(str(fd.get("department"))),
    affiliation: nul(str(fd.get("affiliation"))),
    address: nul(str(fd.get("address"))),
    biography: nul(str(fd.get("biography"))),
    photoUrl: nul(str(fd.get("photoUrl"))),
  };
}

export async function createProfile(_p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  if (!ProfileSchema.safeParse({ name: str(fd.get("name")) }).success) return { error: "Name is required." };
  await prisma.profile.create({ data: profileData(fd) });
  revalidatePath("/admin/profiles");
  redirect("/admin/profiles");
}

export async function updateProfile(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  if (!ProfileSchema.safeParse({ name: str(fd.get("name")) }).success) return { error: "Name is required." };
  await prisma.profile.update({ where: { id }, data: profileData(fd) });
  revalidatePath("/admin/profiles");
  redirect("/admin/profiles");
}

// --- Domain ---------------------------------------------------------------

export async function createDomain(_p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  const name = str(fd.get("name"));
  if (!name) return { error: "Name is required." };
  try {
    await prisma.domain.create({
      data: { name, logoUrl: nul(str(fd.get("logoUrl"))), manager: rel(str(fd.get("managerId"))) },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A domain with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/domains");
  redirect("/admin/domains");
}

export async function updateDomain(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  const name = str(fd.get("name"));
  if (!name) return { error: "Name is required." };
  try {
    await prisma.domain.update({
      where: { id },
      data: { name, logoUrl: nul(str(fd.get("logoUrl"))), manager: relOrClear(str(fd.get("managerId"))) },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A domain with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/domains");
  redirect("/admin/domains");
}

// --- Publisher ------------------------------------------------------------

export async function createPublisher(_p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  const name = str(fd.get("name"));
  if (!name) return { error: "Name is required." };
  try {
    await prisma.publisher.create({
      data: { name, logoUrl: nul(str(fd.get("logoUrl"))), company: rel(str(fd.get("companyId"))) },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A publisher with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/publishers");
  redirect("/admin/publishers");
}

export async function updatePublisher(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  const name = str(fd.get("name"));
  if (!name) return { error: "Name is required." };
  try {
    await prisma.publisher.update({
      where: { id },
      data: { name, logoUrl: nul(str(fd.get("logoUrl"))), company: relOrClear(str(fd.get("companyId"))) },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A publisher with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/publishers");
  redirect("/admin/publishers");
}

// --- Subscription ---------------------------------------------------------

const MODES = ["PRINT", "ONLINE", "PRINT_ONLINE"] as const;
const num = (v: string) => (v && Number.isFinite(Number(v)) ? Number(v) : null);

function subscriptionData(fd: FormData) {
  const mode = str(fd.get("mode"));
  return {
    name: str(fd.get("name")),
    mode: (MODES.includes(mode as (typeof MODES)[number]) ? mode : "PRINT") as (typeof MODES)[number],
    priceUsd: num(str(fd.get("priceUsd"))),
    priceInr: num(str(fd.get("priceInr"))),
  };
}

export async function createSubscription(_p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  if (!str(fd.get("name"))) return { error: "Name is required." };
  try {
    await prisma.subscription.create({ data: subscriptionData(fd) });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A plan with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions");
}

export async function updateSubscription(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  if (!str(fd.get("name"))) return { error: "Name is required." };
  try {
    await prisma.subscription.update({ where: { id }, data: subscriptionData(fd) });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A plan with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/subscriptions");
  redirect("/admin/subscriptions");
}

// --- Company --------------------------------------------------------------

function companyData(fd: FormData) {
  return {
    name: str(fd.get("name")),
    email: nul(str(fd.get("email"))),
    phone: nul(str(fd.get("phone"))),
    website: nul(str(fd.get("website"))),
    logoUrl: nul(str(fd.get("logoUrl"))),
    registeredAddress: nul(str(fd.get("registeredAddress"))),
    salesAddress: nul(str(fd.get("salesAddress"))),
    cin: nul(str(fd.get("cin"))),
    gst: nul(str(fd.get("gst"))),
    bankAccountName: nul(str(fd.get("bankAccountName"))),
    bankAccountNo: nul(str(fd.get("bankAccountNo"))),
    bankIfsc: nul(str(fd.get("bankIfsc"))),
    bankName: nul(str(fd.get("bankName"))),
    bankBranch: nul(str(fd.get("bankBranch"))),
    bankSwift: nul(str(fd.get("bankSwift"))),
  };
}

export async function createCompany(_p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  if (!str(fd.get("name"))) return { error: "Name is required." };
  try {
    await prisma.company.create({ data: { ...companyData(fd), director: rel(str(fd.get("directorId"))) } });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A company with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

export async function updateCompany(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("EDITOR");
  if (!str(fd.get("name"))) return { error: "Name is required." };
  try {
    await prisma.company.update({
      where: { id },
      data: { ...companyData(fd), director: relOrClear(str(fd.get("directorId"))) },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A company with that name already exists." };
    throw e;
  }
  revalidatePath("/admin/companies");
  redirect("/admin/companies");
}

// --- Generic delete (admin only) -----------------------------------------

type Entity = "profile" | "domain" | "publisher" | "subscription" | "company";

export async function deleteEntity(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const entity = String(formData.get("entity")) as Entity;
  const id = String(formData.get("id"));
  switch (entity) {
    case "profile": await prisma.profile.delete({ where: { id } }); break;
    case "domain": await prisma.domain.delete({ where: { id } }); break;
    case "publisher": await prisma.publisher.delete({ where: { id } }); break;
    case "subscription": await prisma.subscription.delete({ where: { id } }); break;
    case "company": await prisma.company.delete({ where: { id } }); break;
    default: return;
  }
  revalidatePath(`/admin/${entity}s`);
  revalidatePath("/");
}

// --- Journal members (board / team) --------------------------------------

const ROLES = [
  "EDITOR_IN_CHIEF",
  "EDITORIAL_BOARD",
  "MANAGING_EDITOR",
  "ADVISOR",
  "REVIEWER",
  "MANAGEMENT_HEAD",
  "MANAGEMENT_MEMBER",
] as const;

export async function addJournalMember(formData: FormData): Promise<void> {
  await requireRole("EDITOR");
  const journalId = String(formData.get("journalId"));
  const profileId = String(formData.get("profileId"));
  const role = String(formData.get("role"));
  const order = Number(formData.get("order")) || 0;
  if (!journalId || !profileId || !ROLES.includes(role as (typeof ROLES)[number])) return;

  await prisma.journalMember.upsert({
    where: { journalId_profileId_role: { journalId, profileId, role: role as (typeof ROLES)[number] } },
    update: { order },
    create: { journalId, profileId, role: role as (typeof ROLES)[number], order },
  });
  revalidatePath(`/journals/${journalId}/edit`);
  revalidatePath("/");
}

export async function removeJournalMember(formData: FormData): Promise<void> {
  await requireRole("EDITOR");
  const id = String(formData.get("id"));
  const member = await prisma.journalMember.delete({ where: { id } });
  revalidatePath(`/journals/${member.journalId}/edit`);
  revalidatePath("/");
}

// --- Allowed sign-in domains (Google OAuth) ------------------------------

// Normalize free-form input to a bare host: lowercase, drop scheme/path, and
// take the part after "@" when a full email was pasted in.
function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (d.includes("@")) d = d.split("@")[1] ?? "";
  return d;
}

export async function addAllowedDomain(_p: FormState, fd: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const domain = normalizeDomain(str(fd.get("domain")));
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return { error: "Enter a valid domain, e.g. celnet.in" };
  try {
    await prisma.allowedDomain.create({ data: { domain } });
  } catch (e) {
    if (isUniqueError(e)) return { error: "That domain is already allowed." };
    throw e;
  }
  revalidatePath("/admin/auth-domains");
  return undefined;
}

export async function removeAllowedDomain(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  await prisma.allowedDomain.delete({ where: { id } });
  revalidatePath("/admin/auth-domains");
}
