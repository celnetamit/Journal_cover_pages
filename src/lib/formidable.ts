import fs from "node:fs";
import path from "node:path";
import { getJournals, type Journal } from "@/lib/journals";
import { dynamicKey } from "@/lib/lookup";
import { parseCsv } from "@/lib/csv";

export type EditorialMember = {
  role: string;
  name: string;
  designation: string;
  department: string;
  affiliation: string;
  location: string;
  email: string;
  photo: string;
  priority: number;
};

export type DynamicJournalDetails = {
  name: string;
  abbreviation: string;
  about: string;
  eIssn: string;
  pIssn: string;
  publisher: string;
  imprint: string;
  address: string;
  publisherEmail: string;
  publisherPhone: string;
  website: string;
};

export type DynamicFocusScope = {
  abbreviation: string;
  about: string;
  focusScope: string[];
  keywords: string[];
  binderText: string;
};

export type DynamicBinderData = {
  detailsByKey: Record<string, DynamicJournalDetails>;
  focusByKey: Record<string, DynamicFocusScope>;
  editorialByKey: Record<string, EditorialMember[]>;
  status: {
    enabled: boolean;
    fetchedAt?: string;
    errors: string[];
  };
};

const localFocusScopeCsvPath = path.join(process.cwd(), "focus-and-scope_formidable_entries.csv");

export function emptyDynamicBinderData(errors: string[] = []): DynamicBinderData {
  return {
    detailsByKey: {},
    focusByKey: {},
    editorialByKey: {},
    status: {
      enabled: true,
      errors,
    },
  };
}

export async function getDynamicBinderData(journal?: Journal): Promise<DynamicBinderData> {
  void journal;
  return getDynamicBinderDataForSearch();
}

export async function getDynamicBinderDataForSearch(search = ""): Promise<DynamicBinderData> {
  void search;
  return {
    detailsByKey: normalizeJournalDetails(getJournals()),
    focusByKey: loadLocalFocusScopeData(),
    editorialByKey: {},
    status: {
      enabled: true,
      fetchedAt: new Date().toISOString(),
      errors: [],
    },
  };
}

function normalizeJournalDetails(journals: Journal[]) {
  const byKey: Record<string, DynamicJournalDetails> = {};

  for (const journal of journals) {
    const details: DynamicJournalDetails = {
      name: journal.name,
      abbreviation: journal.abbreviation,
      about: journal.about,
      eIssn: journal.eIssn,
      pIssn: journal.pIssn,
      publisher: journal.publisher,
      imprint: journal.imprint,
      address: journal.address,
      publisherEmail: journal.publisherEmail,
      publisherPhone: journal.publisherPhone,
      website: journal.website,
    };

    addAliases(byKey, details, [
      journal.abbreviation,
      journal.shortName,
      journal.name,
      journal.id,
    ]);
  }

  return byKey;
}

let cachedFocusScope: Record<string, DynamicFocusScope> | null = null;

function loadLocalFocusScopeData(): Record<string, DynamicFocusScope> {
  if (cachedFocusScope) return cachedFocusScope;

  if (!fs.existsSync(localFocusScopeCsvPath)) {
    cachedFocusScope = {};
    return cachedFocusScope;
  }

  try {
    cachedFocusScope = normalizeLocalFocusScopeCsv(fs.readFileSync(localFocusScopeCsvPath, "utf8"));
  } catch {
    cachedFocusScope = {};
  }

  return cachedFocusScope;
}

function normalizeLocalFocusScopeCsv(input: string) {
  const byKey: Record<string, DynamicFocusScope> = {};
  const [headers = [], ...rows] = parseCsv(input);
  const headerIndex = new Map(headers.map((header, index) => [header.trim(), index]));
  const pick = (row: string[], key: string) => cleanText(row[headerIndex.get(key) ?? -1]);

  for (const row of rows) {
    const abbreviation = pick(row, "Abbreviation") || pick(row, "Abberiviation");
    const focus: DynamicFocusScope = {
      abbreviation,
      about: pick(row, "About"),
      focusScope: listFromRichText(pick(row, "Focus & Scope")),
      keywords: pick(row, "Keywords")
        .split(",")
        .map((item) => cleanText(item))
        .filter(Boolean),
      binderText: pick(row, "In Binder"),
    };

    addAliases(byKey, focus, [
      focus.abbreviation,
      pick(row, "ID"),
      pick(row, "Key"),
    ]);
  }

  return byKey;
}

function listFromRichText(value: string) {
  return value
    .split(/\n|•|†|;|\u2022/g)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function addAliases<T>(target: Record<string, T>, value: T, aliases: Array<string | undefined>) {
  for (const alias of aliases) {
    const key = dynamicKey(alias);
    if (key) target[key] = value;
  }
}
