import "server-only";
import { prisma } from "@/lib/prisma";

export type Option = { id: string; label: string };

// Relation choices for the journal create/edit form.
export async function getJournalFormOptions(): Promise<{
  domains: Option[];
  publishers: Option[];
  profiles: Option[];
}> {
  const [domains, publishers, profiles] = await Promise.all([
    prisma.domain.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.publisher.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.profile.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
  ]);
  return {
    domains: domains.map((d) => ({ id: d.id, label: d.name })),
    publishers: publishers.map((p) => ({ id: p.id, label: p.name })),
    profiles: profiles.map((p) => ({ id: p.id, label: p.email ? `${p.name} (${p.email})` : p.name })),
  };
}

export async function getProfileOptions(): Promise<Option[]> {
  const profiles = await prisma.profile.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } });
  return profiles.map((p) => ({ id: p.id, label: p.email ? `${p.name} (${p.email})` : p.name }));
}

export async function getCompanyOptions(): Promise<Option[]> {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return companies.map((c) => ({ id: c.id, label: c.name }));
}
