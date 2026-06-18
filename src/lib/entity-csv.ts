import "server-only";
import { prisma } from "@/lib/prisma";
import { dynamicKey } from "@/lib/lookup";

export type EntityKey = "journals" | "profiles" | "companies" | "publishers" | "domains" | "subscriptions";

export const ENTITY_KEYS: EntityKey[] = ["journals", "profiles", "companies", "publishers", "domains", "subscriptions"];

export type ImportSummary = { created: number; updated: number; skipped: number; errors: string[] };

type Spec = {
  filename: string;
  headers: string[];
  exportRows: () => Promise<string[][]>;
  importRecords: (records: Record<string, string>[]) => Promise<ImportSummary>;
};

const s = (v: string | undefined) => (v ?? "").trim();
const nul = (v: string | undefined) => {
  const t = s(v);
  return t.length ? t : null;
};
const num = (v: string | undefined) => {
  const t = s(v);
  return t && Number.isFinite(Number(t)) ? Number(t) : null;
};
const list = (values: string[]) => values.filter(Boolean).join(" | ");
const unlist = (v: string | undefined) =>
  s(v)
    .split(/\||\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

function emptySummary(): ImportSummary {
  return { created: 0, updated: 0, skipped: 0, errors: [] };
}

// --- relation lookup maps (built lazily per import) -----------------------

async function profileResolver() {
  const rows = await prisma.profile.findMany({ select: { id: true, name: true, email: true } });
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.email) map.set(`e:${dynamicKey(r.email)}`, r.id);
    map.set(`n:${dynamicKey(r.name)}`, r.id);
  }
  return (value: string) => {
    const key = dynamicKey(value);
    if (!key) return null;
    return map.get(`e:${key}`) ?? map.get(`n:${key}`) ?? null;
  };
}

async function nameResolver(model: "domain" | "publisher" | "company") {
  const rows = await (prisma[model] as { findMany: (a: unknown) => Promise<{ id: string; name: string }[]> }).findMany({
    select: { id: true, name: true },
  });
  const map = new Map(rows.map((r) => [dynamicKey(r.name), r.id]));
  return (value: string) => map.get(dynamicKey(value)) ?? null;
}

// ==========================================================================

export const ENTITY_SPECS: Record<EntityKey, Spec> = {
  profiles: {
    filename: "profiles.csv",
    headers: ["name", "email", "designation", "department", "affiliation", "address", "photoUrl", "signatureUrl", "biography"],
    async exportRows() {
      const rows = await prisma.profile.findMany({ orderBy: { name: "asc" } });
      return rows.map((p) => [p.name, p.email ?? "", p.designation ?? "", p.department ?? "", p.affiliation ?? "", p.address ?? "", p.photoUrl ?? "", p.signatureUrl ?? "", p.biography ?? ""]);
    },
    async importRecords(records) {
      const out = emptySummary();
      for (const [i, r] of records.entries()) {
        const name = s(r.name);
        if (!name) { out.errors.push(`Row ${i + 2}: missing name`); out.skipped++; continue; }
        const data = {
          name,
          email: nul(r.email),
          designation: nul(r.designation),
          department: nul(r.department),
          affiliation: nul(r.affiliation),
          address: nul(r.address),
          photoUrl: nul(r.photoUrl),
          signatureUrl: nul(r.signatureUrl),
          biography: nul(r.biography),
        };
        const existing = data.email
          ? await prisma.profile.findFirst({ where: { email: data.email } })
          : await prisma.profile.findFirst({ where: { name, email: null } });
        if (existing) { await prisma.profile.update({ where: { id: existing.id }, data }); out.updated++; }
        else { await prisma.profile.create({ data }); out.created++; }
      }
      return out;
    },
  },

  domains: {
    filename: "domains.csv",
    headers: ["name", "logoUrl", "manager"],
    async exportRows() {
      const rows = await prisma.domain.findMany({ orderBy: { name: "asc" }, include: { manager: true } });
      return rows.map((d) => [d.name, d.logoUrl ?? "", d.manager?.email || d.manager?.name || ""]);
    },
    async importRecords(records) {
      const out = emptySummary();
      const resolveProfile = await profileResolver();
      for (const [i, r] of records.entries()) {
        const name = s(r.name);
        if (!name) { out.errors.push(`Row ${i + 2}: missing name`); out.skipped++; continue; }
        const managerId = r.manager ? resolveProfile(r.manager) : null;
        const data = { name, logoUrl: nul(r.logoUrl), managerId };
        const existing = await prisma.domain.findUnique({ where: { name } });
        if (existing) { await prisma.domain.update({ where: { name }, data }); out.updated++; }
        else { await prisma.domain.create({ data }); out.created++; }
        if (r.manager && !managerId) out.errors.push(`Row ${i + 2}: manager "${r.manager}" not found (left blank)`);
      }
      return out;
    },
  },

  publishers: {
    filename: "publishers.csv",
    headers: ["name", "logoUrl", "about", "email", "phone", "company"],
    async exportRows() {
      const rows = await prisma.publisher.findMany({ orderBy: { name: "asc" }, include: { company: true } });
      return rows.map((p) => [p.name, p.logoUrl ?? "", p.about ?? "", p.email ?? "", p.phone ?? "", p.company?.name ?? ""]);
    },
    async importRecords(records) {
      const out = emptySummary();
      const resolveCompany = await nameResolver("company");
      for (const [i, r] of records.entries()) {
        const name = s(r.name);
        if (!name) { out.errors.push(`Row ${i + 2}: missing name`); out.skipped++; continue; }
        const companyId = r.company ? resolveCompany(r.company) : null;
        const data = { name, logoUrl: nul(r.logoUrl), about: nul(r.about), email: nul(r.email), phone: nul(r.phone), companyId };
        const existing = await prisma.publisher.findUnique({ where: { name } });
        if (existing) { await prisma.publisher.update({ where: { name }, data }); out.updated++; }
        else { await prisma.publisher.create({ data }); out.created++; }
        if (r.company && !companyId) out.errors.push(`Row ${i + 2}: company "${r.company}" not found (left blank)`);
      }
      return out;
    },
  },

  subscriptions: {
    filename: "subscriptions.csv",
    headers: ["name", "mode", "priceUsd", "priceInr"],
    async exportRows() {
      const rows = await prisma.subscription.findMany({ orderBy: { name: "asc" } });
      return rows.map((p) => [p.name, p.mode, p.priceUsd != null ? String(p.priceUsd) : "", p.priceInr != null ? String(p.priceInr) : ""]);
    },
    async importRecords(records) {
      const out = emptySummary();
      const MODES = ["PRINT", "ONLINE", "PRINT_ONLINE"];
      for (const [i, r] of records.entries()) {
        const name = s(r.name);
        if (!name) { out.errors.push(`Row ${i + 2}: missing name`); out.skipped++; continue; }
        const mode = MODES.includes(s(r.mode)) ? (s(r.mode) as "PRINT" | "ONLINE" | "PRINT_ONLINE") : "PRINT_ONLINE";
        const data = { name, mode, priceUsd: num(r.priceUsd), priceInr: num(r.priceInr) };
        const existing = await prisma.subscription.findUnique({ where: { name } });
        if (existing) { await prisma.subscription.update({ where: { name }, data }); out.updated++; }
        else { await prisma.subscription.create({ data }); out.created++; }
      }
      return out;
    },
  },

  companies: {
    filename: "companies.csv",
    headers: ["name", "email", "phone", "website", "cin", "gst", "printedBy", "openAccessIndia", "openAccessSaarc", "openAccessOther", "registeredAddress", "salesAddress", "bankAccountName", "bankAccountNo", "bankIfsc", "bankName", "bankBranch", "bankSwift", "directorDeskTitle", "directorDeskParagraphs", "dispatchContactName", "dispatchContactPhone", "dispatchContactEmail", "salesContactName", "salesContactPhone", "salesContactEmail", "director"],
    async exportRows() {
      const rows = await prisma.company.findMany({ orderBy: { name: "asc" }, include: { director: true } });
      return rows.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.website ?? "", c.cin ?? "", c.gst ?? "", c.printedBy ?? "", c.openAccessIndia ?? "", c.openAccessSaarc ?? "", c.openAccessOther ?? "", c.registeredAddress ?? "", c.salesAddress ?? "", c.bankAccountName ?? "", c.bankAccountNo ?? "", c.bankIfsc ?? "", c.bankName ?? "", c.bankBranch ?? "", c.bankSwift ?? "", c.directorDeskTitle ?? "", list(c.directorDeskParagraphs), c.dispatchContactName ?? "", c.dispatchContactPhone ?? "", c.dispatchContactEmail ?? "", c.salesContactName ?? "", c.salesContactPhone ?? "", c.salesContactEmail ?? "", c.director?.email || c.director?.name || ""]);
    },
    async importRecords(records) {
      const out = emptySummary();
      const resolveProfile = await profileResolver();
      for (const [i, r] of records.entries()) {
        const name = s(r.name);
        if (!name) { out.errors.push(`Row ${i + 2}: missing name`); out.skipped++; continue; }
        const directorId = r.director ? resolveProfile(r.director) : null;
        const data = {
          name, email: nul(r.email), phone: nul(r.phone), website: nul(r.website), cin: nul(r.cin), gst: nul(r.gst),
          printedBy: nul(r.printedBy),
          openAccessIndia: nul(r.openAccessIndia), openAccessSaarc: nul(r.openAccessSaarc), openAccessOther: nul(r.openAccessOther),
          registeredAddress: nul(r.registeredAddress), salesAddress: nul(r.salesAddress),
          bankAccountName: nul(r.bankAccountName), bankAccountNo: nul(r.bankAccountNo), bankIfsc: nul(r.bankIfsc),
          bankName: nul(r.bankName), bankBranch: nul(r.bankBranch), bankSwift: nul(r.bankSwift), directorId,
          directorDeskTitle: nul(r.directorDeskTitle), directorDeskParagraphs: unlist(r.directorDeskParagraphs),
          dispatchContactName: nul(r.dispatchContactName), dispatchContactPhone: nul(r.dispatchContactPhone), dispatchContactEmail: nul(r.dispatchContactEmail),
          salesContactName: nul(r.salesContactName), salesContactPhone: nul(r.salesContactPhone), salesContactEmail: nul(r.salesContactEmail),
        };
        const existing = await prisma.company.findUnique({ where: { name } });
        if (existing) { await prisma.company.update({ where: { name }, data }); out.updated++; }
        else { await prisma.company.create({ data }); out.created++; }
        if (r.director && !directorId) out.errors.push(`Row ${i + 2}: director "${r.director}" not found (left blank)`);
      }
      return out;
    },
  },

  journals: {
    filename: "journals.csv",
    headers: ["slug", "name", "abbreviation", "shortName", "website", "manuscriptUrl", "issnPrint", "issnOnline", "sjif", "icv", "doi", "impactFactor", "frequency", "issuesPerYear", "about", "manuscriptNotice", "directorDeskTitle", "directorDeskParagraphs", "focusScope", "focusNotes", "objectives", "salientFeatures", "keywords", "indexing", "domain", "publisher", "manager"],
    async exportRows() {
      const rows = await prisma.journal.findMany({ orderBy: { name: "asc" }, include: { domain: true, publisher: true, manager: true } });
      return rows.map((j) => [
        j.slug, j.name, j.abbreviation, j.shortName ?? "", j.website ?? "", j.manuscriptUrl ?? "", j.issnPrint ?? "", j.issnOnline ?? "",
        j.sjif ?? "", j.icv ?? "", j.doi ?? "", j.impactFactor ?? "", j.frequency, j.issuesPerYear != null ? String(j.issuesPerYear) : "",
        j.about ?? "", j.manuscriptNotice ?? "", j.directorDeskTitle ?? "", list(j.directorDeskParagraphs), list(j.focusScope), list(j.focusNotes), list(j.objectives), list(j.salientFeatures), list(j.keywords), list(j.indexing),
        j.domain?.name ?? "", j.publisher?.name ?? "", j.manager?.email || j.manager?.name || "",
      ]);
    },
    async importRecords(records) {
      const out = emptySummary();
      const resolveProfile = await profileResolver();
      const resolveDomain = await nameResolver("domain");
      const resolvePublisher = await nameResolver("publisher");
      const FREQ = ["ANNUAL", "BIANNUAL", "TRIANNUAL", "QUARTERLY", "BIMONTHLY", "MONTHLY", "OTHER"] as const;
      for (const [i, r] of records.entries()) {
        const name = s(r.name);
        const abbreviation = s(r.abbreviation).toUpperCase();
        if (!name || !abbreviation) { out.errors.push(`Row ${i + 2}: missing name or abbreviation`); out.skipped++; continue; }
        const slug = dynamicKey(r.slug) || dynamicKey(abbreviation) || dynamicKey(name);
        const freqRaw = s(r.frequency);
        const frequency = (FREQ as readonly string[]).includes(freqRaw) ? (freqRaw as (typeof FREQ)[number]) : "OTHER";
        const data = {
          name, abbreviation, slug,
          shortName: nul(r.shortName), website: nul(r.website), manuscriptUrl: nul(r.manuscriptUrl), issnPrint: nul(r.issnPrint), issnOnline: nul(r.issnOnline),
          sjif: nul(r.sjif), icv: nul(r.icv), doi: nul(r.doi), impactFactor: nul(r.impactFactor),
          frequency, issuesPerYear: num(r.issuesPerYear), about: nul(r.about), manuscriptNotice: nul(r.manuscriptNotice),
          directorDeskTitle: nul(r.directorDeskTitle), directorDeskParagraphs: unlist(r.directorDeskParagraphs),
          focusScope: unlist(r.focusScope), focusNotes: unlist(r.focusNotes), objectives: unlist(r.objectives), salientFeatures: unlist(r.salientFeatures), keywords: unlist(r.keywords), indexing: unlist(r.indexing),
          domainId: r.domain ? resolveDomain(r.domain) : null,
          publisherId: r.publisher ? resolvePublisher(r.publisher) : null,
          managerId: r.manager ? resolveProfile(r.manager) : null,
        };
        const existing = await prisma.journal.findUnique({ where: { slug } });
        if (existing) { await prisma.journal.update({ where: { slug }, data }); out.updated++; }
        else { await prisma.journal.create({ data }); out.created++; }
        if (r.domain && !data.domainId) out.errors.push(`Row ${i + 2}: domain "${r.domain}" not found`);
        if (r.publisher && !data.publisherId) out.errors.push(`Row ${i + 2}: publisher "${r.publisher}" not found`);
      }
      return out;
    },
  },
};
