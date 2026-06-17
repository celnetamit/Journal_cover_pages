/**
 * Seed the database from the committed CSVs (one-time import of record).
 *  - journals_list.csv  -> Domain, Company, Publisher, Profile, Journal, JournalMember
 *  - focus-and-scope_formidable_entries.csv -> Journal.about / focusScope / keywords
 * Plus global Subscription plans and a seeded admin User (from ADMIN_* env).
 *
 * Idempotent: re-running upserts on natural keys instead of duplicating rows.
 * Run with: npm run db:seed   (tsx prisma/seed.ts)
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseCsv } from "../src/lib/csv";
import {
  PrismaClient,
  type JournalFrequency,
  type JournalRole,
  type SubscriptionMode,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const root = process.cwd();

// --- text helpers ---------------------------------------------------------

function clean(value: string | undefined): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/li>|<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&#039;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function dynamicKey(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function splitList(value: string | undefined): string[] {
  return clean(value)
    .split(/\n|•|†|;|•|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInt(value: string | undefined): number | null {
  const match = clean(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

function toFloat(value: string | undefined): number | null {
  const match = clean(value).replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function mapFrequency(label: string, issuesPerYear: number | null): JournalFrequency {
  const text = label.toLowerCase();
  const n = issuesPerYear ?? 0;
  if (n === 12 || /month/.test(text)) return "MONTHLY";
  if (n === 6 || /bi-?month/.test(text)) return "BIMONTHLY";
  if (n === 4 || /quarter/.test(text)) return "QUARTERLY";
  if (n === 3 || /tri-?annual|three/.test(text)) return "TRIANNUAL";
  if (n === 2 || /bi-?annual|half-?year|semi/.test(text)) return "BIANNUAL";
  if (n === 1 || /annual|yearly/.test(text)) return "ANNUAL";
  return "OTHER";
}

function csvExists(file: string): boolean {
  return fs.existsSync(path.join(root, file));
}

function readCsv(file: string): { rows: string[][]; pick: (row: string[], key: string) => string } {
  const raw = fs.readFileSync(path.join(root, file), "utf8");
  const [headers = [], ...rows] = parseCsv(raw);
  const headerIndex = new Map(headers.map((h, i) => [h.trim(), i]));
  const pick = (row: string[], key: string) => clean(row[headerIndex.get(key) ?? -1]);
  return { rows, pick };
}

// --- caches to avoid repeated DB round-trips ------------------------------

const domainCache = new Map<string, string>(); // name -> id
const companyCache = new Map<string, string>();
const publisherCache = new Map<string, string>();
const profileCache = new Map<string, string>(); // dedupe key -> id
const usedSlugs = new Set<string>();

async function upsertDomain(name: string, logoUrl?: string): Promise<string | null> {
  if (!name) return null;
  if (domainCache.has(name)) return domainCache.get(name)!;
  const row = await prisma.domain.upsert({
    where: { name },
    update: { logoUrl: logoUrl || undefined },
    create: { name, logoUrl: logoUrl || null },
  });
  domainCache.set(name, row.id);
  return row.id;
}

async function upsertCompany(name: string, data: {
  email?: string; phone?: string; registeredAddress?: string;
}): Promise<string | null> {
  if (!name) return null;
  if (companyCache.has(name)) return companyCache.get(name)!;
  const row = await prisma.company.upsert({
    where: { name },
    update: {
      email: data.email || undefined,
      phone: data.phone || undefined,
      registeredAddress: data.registeredAddress || undefined,
    },
    create: {
      name,
      email: data.email || null,
      phone: data.phone || null,
      registeredAddress: data.registeredAddress || null,
    },
  });
  companyCache.set(name, row.id);
  return row.id;
}

async function upsertPublisher(name: string, companyId: string | null): Promise<string | null> {
  if (!name) return null;
  if (publisherCache.has(name)) return publisherCache.get(name)!;
  const row = await prisma.publisher.upsert({
    where: { name },
    update: { companyId: companyId || undefined },
    create: { name, companyId },
  });
  publisherCache.set(name, row.id);
  return row.id;
}

async function upsertProfile(data: {
  name: string; email?: string; designation?: string; department?: string; photoUrl?: string;
}): Promise<string | null> {
  const name = clean(data.name);
  if (!name) return null;
  const key = (data.email && dynamicKey(data.email)) || dynamicKey(name);
  if (profileCache.has(key)) return profileCache.get(key)!;

  const existing = data.email
    ? await prisma.profile.findFirst({ where: { email: data.email } })
    : await prisma.profile.findFirst({ where: { name, email: null } });

  const row = existing
    ? await prisma.profile.update({
        where: { id: existing.id },
        data: {
          designation: data.designation || undefined,
          department: data.department || undefined,
          photoUrl: data.photoUrl || undefined,
        },
      })
    : await prisma.profile.create({
        data: {
          name,
          email: data.email || null,
          designation: data.designation || null,
          department: data.department || null,
          photoUrl: data.photoUrl || null,
        },
      });
  profileCache.set(key, row.id);
  return row.id;
}

function uniqueSlug(base: string, fallback: string): string {
  let slug = base || fallback;
  let candidate = slug;
  let n = 2;
  while (usedSlugs.has(candidate)) candidate = `${slug}-${n++}`;
  usedSlugs.add(candidate);
  return candidate;
}

// --- subscriptions --------------------------------------------------------

async function seedSubscriptions(): Promise<Record<SubscriptionMode, string>> {
  const plans: { name: string; mode: SubscriptionMode }[] = [
    { name: "Print", mode: "PRINT" },
    { name: "Online", mode: "ONLINE" },
    { name: "Print + Online", mode: "PRINT_ONLINE" },
  ];
  const ids = {} as Record<SubscriptionMode, string>;
  for (const plan of plans) {
    const row = await prisma.subscription.upsert({
      where: { name: plan.name },
      update: { mode: plan.mode },
      create: plan,
    });
    ids[plan.mode] = row.id;
  }
  return ids;
}

// --- main -----------------------------------------------------------------

async function seedJournals(subscriptionIds: Record<SubscriptionMode, string>) {
  const { rows, pick } = readCsv("journals_list.csv");
  let count = 0;

  for (const row of rows) {
    const legacyId = pick(row, "ID") || pick(row, "Key") || pick(row, "Abbreviation");
    const name = pick(row, "Journal Name");
    if (!legacyId || !name) continue;

    const abbreviation = pick(row, "Abbreviation").toUpperCase();
    const domainId = await upsertDomain(pick(row, "Domain"), pick(row, "Indexing Logo URL") || pick(row, "Indexing Logo Img"));

    const companyName = pick(row, "Imprint") || pick(row, "Publisher");
    const companyId = await upsertCompany(companyName, {
      email: pick(row, "Publisher Email"),
      phone: pick(row, "Publisher Contact Number"),
      registeredAddress: pick(row, "Address"),
    });
    const publisherId = await upsertPublisher(pick(row, "Publisher") || companyName, companyId);

    const managerId = await upsertProfile({
      name: pick(row, "JM Name") || "Gaurav Tiwari",
      email: pick(row, "Jm Email") || "info@mbajournals.in",
      designation: pick(row, "JM Designation") || "Journal Manager",
      photoUrl: pick(row, "JM Image LINK"),
    });

    const issuesPerYear = toInt(pick(row, "Issues Per Year"));
    const frequencyLabel = pick(row, "Frequency");
    const slug = uniqueSlug(dynamicKey(abbreviation), dynamicKey(name) || dynamicKey(legacyId));

    const data = {
      legacyId,
      slug,
      name,
      abbreviation,
      shortName: pick(row, "Short Name") || null,
      website: pick(row, "Journal Website/URL") || null,
      issnPrint: pick(row, "p-ISSN") || null,
      issnOnline: pick(row, "e-ISSN") || null,
      icv: pick(row, "ICV Value") || null,
      doi: pick(row, "Journal DOI Number") || null,
      impactFactor: pick(row, "Impact Factor") || null,
      indexing: splitList(pick(row, "Indexing")),
      indexingLogoUrl: pick(row, "Indexing Logo URL") || pick(row, "Indexing Logo Img") || null,
      codeN: pick(row, "CODEN") || null,
      startedSince: pick(row, "Started Since") || null,
      typeOfPublication: pick(row, "Type of Publication") || null,
      access: pick(row, "Type of Access") || null,
      language: pick(row, "Language") || null,
      issuesPerYear,
      frequency: mapFrequency(frequencyLabel, issuesPerYear),
      frequencyLabel: frequencyLabel || null,
      coverFrontUrl: pick(row, "Journal Image URL") || pick(row, "Journal Image/Logo") || null,
      logoUrl: pick(row, "Journal Logo URL") || null,
      about: pick(row, "About Journal") || null,
      keywords: splitList(pick(row, "Focus and Scope (Keywords)") || pick(row, "Keywords")),
      domainId,
      publisherId,
      managerId,
    };

    const journal = await prisma.journal.upsert({
      where: { legacyId },
      update: data,
      create: data,
    });

    // Chief editor -> JournalMember(EDITOR_IN_CHIEF)
    const chiefName = pick(row, "Chief Editor");
    if (chiefName) {
      const chiefId = await upsertProfile({
        name: chiefName,
        email: pick(row, "Email"),
        designation: "Editor-in-Chief",
      });
      if (chiefId) {
        await addMember(journal.id, chiefId, "EDITOR_IN_CHIEF", 0);
      }
    }
    if (managerId) {
      await addMember(journal.id, managerId, "MANAGING_EDITOR", 1);
    }

    // Per-journal subscription price overrides where the CSV has prices.
    await addSubscriptionPrice(journal.id, subscriptionIds.PRINT, pick(row, "Print $"));
    await addSubscriptionPrice(journal.id, subscriptionIds.ONLINE, pick(row, "Online $"));
    await addSubscriptionPrice(journal.id, subscriptionIds.PRINT_ONLINE, pick(row, "Print + Online  $") || pick(row, "Print + Online $"));

    count += 1;
  }
  return count;
}

async function addMember(journalId: string, profileId: string, role: JournalRole, order: number) {
  await prisma.journalMember.upsert({
    where: { journalId_profileId_role: { journalId, profileId, role } },
    update: { order },
    create: { journalId, profileId, role, order },
  });
}

async function addSubscriptionPrice(journalId: string, subscriptionId: string, priceText: string) {
  const inr = toFloat(priceText);
  if (inr == null) return;
  await prisma.journalSubscription.upsert({
    where: { journalId_subscriptionId: { journalId, subscriptionId } },
    update: { priceInr: inr },
    create: { journalId, subscriptionId, priceInr: inr },
  });
}

async function seedFocusScope() {
  const { rows, pick } = readCsv("focus-and-scope_formidable_entries.csv");
  // Build best entry per abbreviation key (later rows win; prefer ones with content).
  const byKey = new Map<string, { about: string; focus: string[]; keywords: string[] }>();
  for (const row of rows) {
    const abbr = pick(row, "Abbreviation") || pick(row, "Abberiviation");
    const key = dynamicKey(abbr);
    if (!key) continue;
    const about = pick(row, "About");
    const focus = splitList(pick(row, "Focus & Scope"));
    const keywords = splitList(pick(row, "Keywords"));
    const existing = byKey.get(key);
    // Keep the richest entry seen for this key.
    if (!existing || about.length + focus.length > existing.about.length + existing.focus.length) {
      byKey.set(key, { about, focus, keywords });
    }
  }

  const journals = await prisma.journal.findMany({ select: { id: true, abbreviation: true, slug: true } });
  let matched = 0;
  for (const j of journals) {
    const entry = byKey.get(dynamicKey(j.abbreviation)) || byKey.get(j.slug);
    if (!entry) continue;
    await prisma.journal.update({
      where: { id: j.id },
      data: {
        about: entry.about || undefined,
        focusScope: entry.focus.length ? entry.focus : undefined,
        keywords: entry.keywords.length ? entry.keywords : undefined,
      },
    });
    matched += 1;
  }
  return matched;
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• Admin seed skipped (ADMIN_EMAIL / ADMIN_PASSWORD not set).");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", active: true },
    create: { email, name: process.env.ADMIN_NAME || "Administrator", passwordHash, role: "ADMIN", active: true },
  });
  console.log(`• Admin user ready: ${email}`);
}

async function main() {
  console.log("Seeding database…");

  // Admin + subscription plans first: these never depend on the CSV files, so a
  // CSV-less deployment can still log in.
  await seedAdmin();
  const subscriptionIds = await seedSubscriptions();
  console.log("• Subscription plans ready.");

  if (csvExists("journals_list.csv")) {
    const journals = await seedJournals(subscriptionIds);
    console.log(`• Journals upserted: ${journals}`);
    if (csvExists("focus-and-scope_formidable_entries.csv")) {
      const focus = await seedFocusScope();
      console.log(`• Focus/scope matched onto journals: ${focus}`);
    }
  } else {
    console.log("• CSV files not found — skipping journal/focus seed (admin + plans only).");
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
