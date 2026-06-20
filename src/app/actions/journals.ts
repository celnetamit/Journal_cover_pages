"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { dynamicKey } from "@/lib/lookup";

export type JournalActionState = { error?: string } | undefined;

const FREQUENCIES = [
  "ANNUAL",
  "BIANNUAL",
  "TRIANNUAL",
  "QUARTERLY",
  "BIMONTHLY",
  "MONTHLY",
  "OTHER",
] as const;

const JournalSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  abbreviation: z.string().trim().min(1, "Abbreviation is required."),
  slug: z.string().trim().optional(),
  shortName: z.string().trim().optional(),
  website: z.string().trim().optional(),
  issnOnline: z.string().trim().optional(),
  issnPrint: z.string().trim().optional(),
  sjif: z.string().trim().optional(),
  icv: z.string().trim().optional(),
  doi: z.string().trim().optional(),
  impactFactor: z.string().trim().optional(),
  about: z.string().trim().optional(),
  manuscriptUrl: z.string().trim().optional(),
  directorDeskTitle: z.string().optional(),
  directorDeskParagraphs: z.string().optional(),
  manuscriptNotice: z.string().trim().optional(),
  frequency: z.enum(FREQUENCIES).default("OTHER"),
  frequencyLabel: z.string().trim().optional(),
  issuesPerYear: z.coerce.number().int().positive().optional(),
  typeOfPublication: z.string().trim().optional(),
  access: z.string().trim().optional(),
  language: z.string().trim().optional(),
  coverFrontUrl: z.string().trim().optional(),
  coverBackUrl: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  indexingLogoUrl: z.string().trim().optional(),
  domainId: z.string().trim().optional(),
  publisherId: z.string().trim().optional(),
  managerId: z.string().trim().optional(),
  focusScope: z.string().optional(),
  objectives: z.string().optional(),
  salientFeatures: z.string().optional(),
  keywords: z.string().optional(),
  indexing: z.string().optional(),
});

const lines = (v: string | undefined) =>
  (v ?? "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

const commas = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const blankToNull = (v: string | undefined) => (v && v.length ? v : null);
const relation = (id: string | undefined) =>
  id && id.length ? { connect: { id } } : undefined;

function parse(formData: FormData) {
  return JournalSchema.safeParse({
    name: formData.get("name"),
    abbreviation: formData.get("abbreviation"),
    slug: formData.get("slug") || undefined,
    shortName: formData.get("shortName") || undefined,
    website: formData.get("website") || undefined,
    issnOnline: formData.get("issnOnline") || undefined,
    issnPrint: formData.get("issnPrint") || undefined,
    sjif: formData.get("sjif") || undefined,
    icv: formData.get("icv") || undefined,
    doi: formData.get("doi") || undefined,
    impactFactor: formData.get("impactFactor") || undefined,
    about: formData.get("about") || undefined,
    manuscriptUrl: formData.get("manuscriptUrl") || undefined,
    manuscriptNotice: formData.get("manuscriptNotice") || undefined,
    directorDeskTitle: formData.get("directorDeskTitle") || undefined,
    directorDeskParagraphs: formData.get("directorDeskParagraphs") || undefined,
    frequency: formData.get("frequency") || "OTHER",
    frequencyLabel: formData.get("frequencyLabel") || undefined,
    issuesPerYear: formData.get("issuesPerYear") || undefined,
    typeOfPublication: formData.get("typeOfPublication") || undefined,
    access: formData.get("access") || undefined,
    language: formData.get("language") || undefined,
    coverFrontUrl: formData.get("coverFrontUrl") || undefined,
    coverBackUrl: formData.get("coverBackUrl") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    indexingLogoUrl: formData.get("indexingLogoUrl") || undefined,
    domainId: formData.get("domainId") || undefined,
    publisherId: formData.get("publisherId") || undefined,
    managerId: formData.get("managerId") || undefined,
    focusScope: formData.get("focusScope") || undefined,
    objectives: formData.get("objectives") || undefined,
    salientFeatures: formData.get("salientFeatures") || undefined,
    keywords: formData.get("keywords") || undefined,
    indexing: formData.get("indexing") || undefined,
  });
}

function scalarData(d: z.infer<typeof JournalSchema>) {
  return {
    name: d.name,
    abbreviation: d.abbreviation.toUpperCase(),
    shortName: blankToNull(d.shortName),
    website: blankToNull(d.website),
    issnOnline: blankToNull(d.issnOnline),
    issnPrint: blankToNull(d.issnPrint),
    sjif: blankToNull(d.sjif),
    icv: blankToNull(d.icv),
    doi: blankToNull(d.doi),
    impactFactor: blankToNull(d.impactFactor),
    about: blankToNull(d.about),
    manuscriptUrl: blankToNull(d.manuscriptUrl),
    manuscriptNotice: blankToNull(d.manuscriptNotice),
    directorDeskTitle: blankToNull(d.directorDeskTitle),
    directorDeskParagraphs: lines(d.directorDeskParagraphs),
    frequency: d.frequency,
    frequencyLabel: blankToNull(d.frequencyLabel),
    issuesPerYear: d.issuesPerYear ?? null,
    typeOfPublication: blankToNull(d.typeOfPublication),
    access: blankToNull(d.access),
    language: blankToNull(d.language),
    coverFrontUrl: blankToNull(d.coverFrontUrl),
    coverBackUrl: blankToNull(d.coverBackUrl),
    logoUrl: blankToNull(d.logoUrl),
    indexingLogoUrl: blankToNull(d.indexingLogoUrl),
    focusScope: lines(d.focusScope),
    objectives: lines(d.objectives),
    salientFeatures: lines(d.salientFeatures),
    keywords: commas(d.keywords),
    indexing: commas(d.indexing),
  };
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || "journal";
  let n = 2;
  // Loop until the slug is free (ignoring the row being updated).
  for (;;) {
    const existing = await prisma.journal.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n++}`;
  }
}

export async function createJournal(_prev: JournalActionState, formData: FormData): Promise<JournalActionState> {
  await requireRole("EDITOR");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const slug = await uniqueSlug(dynamicKey(d.slug || d.abbreviation) || dynamicKey(d.name));
  await prisma.journal.create({
    data: {
      ...scalarData(d),
      slug,
      domain: relation(d.domainId),
      publisher: relation(d.publisherId),
      manager: relation(d.managerId),
    },
  });
  revalidatePath("/journals");
  revalidatePath("/");
  redirect("/journals");
}

export async function updateJournal(id: string, _prev: JournalActionState, formData: FormData): Promise<JournalActionState> {
  await requireRole("EDITOR");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const slug = await uniqueSlug(dynamicKey(d.slug || d.abbreviation) || dynamicKey(d.name), id);
  await prisma.journal.update({
    where: { id },
    data: {
      ...scalarData(d),
      slug,
      domain: d.domainId ? { connect: { id: d.domainId } } : { disconnect: true },
      publisher: d.publisherId ? { connect: { id: d.publisherId } } : { disconnect: true },
      manager: d.managerId ? { connect: { id: d.managerId } } : { disconnect: true },
    },
  });
  revalidatePath("/journals");
  revalidatePath("/");
  redirect("/journals");
}

export async function deleteJournal(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  await prisma.journal.delete({ where: { id } });
  revalidatePath("/journals");
  revalidatePath("/");
}
