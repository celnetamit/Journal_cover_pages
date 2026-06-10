import type { Journal } from "@/lib/journals";

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

type FormidableField = {
  field_key?: string;
  name?: string;
};

type FormidableEntry = {
  id?: string;
  item_key?: string;
  name?: string;
  meta?: Record<string, unknown>;
};

type FieldMap = Record<string, FormidableField>;
type EntryMap = Record<string, FormidableEntry>;

const formIds = {
  journalDetails: process.env.FORMIDABLE_JOURNAL_DETAILS_FORM_ID || "10",
  editorialBoard: process.env.FORMIDABLE_EDITORIAL_BOARD_FORM_ID || "64",
  focusScope: process.env.FORMIDABLE_FOCUS_SCOPE_FORM_ID || "67",
};

export function dynamicKey(value: string | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function journalLookupKeys(journal: Journal) {
  return [
    dynamicKey(journal.abbreviation),
    dynamicKey(journal.shortName),
    dynamicKey(journal.name),
    dynamicKey(journal.id),
  ].filter(Boolean);
}

export function emptyDynamicBinderData(errors: string[] = []): DynamicBinderData {
  return {
    detailsByKey: {},
    focusByKey: {},
    editorialByKey: {},
    status: {
      enabled: false,
      errors,
    },
  };
}

export async function getDynamicBinderData(journal?: Journal): Promise<DynamicBinderData> {
  return getDynamicBinderDataForSearch(journal?.abbreviation || journal?.name || "");
}

export async function getDynamicBinderDataForSearch(search = ""): Promise<DynamicBinderData> {
  const baseUrl = process.env.WORDPRESS_API_BASE;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_APPLICATION_PASSWORD;

  if (!baseUrl || !username || !password) {
    return emptyDynamicBinderData(["WordPress API env values are not configured."]);
  }

  const client = new FormidableClient(baseUrl, username, password);
  const errors: string[] = [];

  const [details, focus, editorial] = await Promise.all([
    client.formBundle(formIds.journalDetails, search).catch((error: unknown) => {
      errors.push(`Journal details fetch failed: ${errorMessage(error)}`);
      return null;
    }),
    client.formBundle(formIds.focusScope, search).catch((error: unknown) => {
      errors.push(`Focus/scope fetch failed: ${errorMessage(error)}`);
      return null;
    }),
    client.formBundle(formIds.editorialBoard, search).catch((error: unknown) => {
      errors.push(`Editorial board fetch failed: ${errorMessage(error)}`);
      return null;
    }),
  ]);

  return {
    detailsByKey: details ? normalizeDetails(details.fields, details.entries) : {},
    focusByKey: focus ? normalizeFocusScope(focus.fields, focus.entries) : {},
    editorialByKey: editorial ? normalizeEditorial(editorial.fields, editorial.entries) : {},
    status: {
      enabled: true,
      fetchedAt: new Date().toISOString(),
      errors,
    },
  };
}

class FormidableClient {
  private readonly auth: string;
  private readonly baseUrl: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.auth = Buffer.from(`${username}:${password}`).toString("base64");
  }

  async formBundle(formId: string, search = "") {
    const [fields, entries] = await Promise.all([
      this.get<FieldMap>(`/wp-json/frm/v2/forms/${formId}/fields`),
      this.getEntries(formId, search),
    ]);

    return { fields, entries };
  }

  private async getEntries(formId: string, search = "") {
    const pageSize = 500;
    const combined: EntryMap = {};
    const query = new URLSearchParams({
      page_size: String(pageSize),
    });

    if (search) query.set("search", search);

    for (let page = 1; page <= 2; page += 1) {
      query.set("page", String(page));
      const entries = await this.get<EntryMap>(`/wp-json/frm/v2/forms/${formId}/entries?${query}`);
      const values = Object.entries(entries);

      for (const [key, entry] of values) {
        combined[key] = entry;
      }

      if (values.length < pageSize) break;
    }

    return combined;
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Basic ${this.auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const body = await response.text();
    let json: unknown;

    try {
      json = JSON.parse(body);
    } catch {
      throw new Error(`Invalid JSON response (${response.status})`);
    }

    if (!response.ok || hasApiError(json)) {
      throw new Error(apiErrorMessage(json, response.status));
    }

    return json as T;
  }
}

function normalizeDetails(fields: FieldMap, entries: EntryMap) {
  const byKey: Record<string, DynamicJournalDetails> = {};

  for (const entry of Object.values(entries)) {
    const meta = entry.meta || {};
    const details: DynamicJournalDetails = {
      name: fieldText(fields, meta, ["Journal Name", "Journal"]),
      abbreviation: fieldText(fields, meta, ["Abbreviation", "New Abb"]),
      about: fieldText(fields, meta, ["About Journal", "About"]),
      eIssn: fieldText(fields, meta, ["e-ISSN"]),
      pIssn: fieldText(fields, meta, ["p-ISSN"]),
      publisher: fieldText(fields, meta, ["Publisher"]),
      imprint: fieldText(fields, meta, ["Imprint"]),
      address: fieldText(fields, meta, ["Address"]),
      publisherEmail: fieldText(fields, meta, ["Publisher Email"]),
      publisherPhone: fieldText(fields, meta, ["Publisher Contact Number"]),
      website: fieldText(fields, meta, ["Journal Website/URL", "Current Issue URL"]),
    };

    addAliases(byKey, details, [
      details.abbreviation,
      details.name,
      entry.name,
      entry.id,
      entry.item_key,
    ]);
  }

  return byKey;
}

function normalizeFocusScope(fields: FieldMap, entries: EntryMap) {
  const byKey: Record<string, DynamicFocusScope> = {};

  for (const entry of Object.values(entries)) {
    const meta = entry.meta || {};
    const focus: DynamicFocusScope = {
      abbreviation: fieldText(fields, meta, ["Abbreviation", "Abberiviation"]),
      about: fieldText(fields, meta, ["About"]),
      focusScope: listFromRichText(fieldText(fields, meta, ["Focus & Scope"])),
      keywords: fieldText(fields, meta, ["Keywords"])
        .split(",")
        .map((item) => cleanText(item))
        .filter(Boolean),
      binderText: fieldText(fields, meta, ["In Binder"]),
    };

    addAliases(byKey, focus, [
      focus.abbreviation,
      entry.name,
      entry.id,
      entry.item_key,
    ]);
  }

  return byKey;
}

function normalizeEditorial(fields: FieldMap, entries: EntryMap) {
  const grouped: Record<string, EditorialMember[]> = {};

  for (const entry of Object.values(entries)) {
    const meta = entry.meta || {};
    const abbreviation = fieldText(fields, meta, ["Abbreviation"]);
    const member: EditorialMember = {
      role: fieldText(fields, meta, ["Role"]) || "Editor",
      name: fieldText(fields, meta, ["Full Name", "Editor Name"]),
      designation: fieldText(fields, meta, ["Editor Designation"]),
      department: fieldText(fields, meta, ["Editors Department"]),
      affiliation: fieldText(fields, meta, ["Affiliation"]),
      location: [fieldText(fields, meta, ["Affiliation State"]), fieldText(fields, meta, ["Affiliation Country"])]
        .filter(Boolean)
        .join(", "),
      email: fieldText(fields, meta, ["Official Email", "Personal Email"]),
      photo: fieldText(fields, meta, ["Profile Picture"]),
      priority: Number(fieldText(fields, meta, ["Priority"])) || 999,
    };

    if (!member.name) continue;

    for (const key of [dynamicKey(abbreviation), dynamicKey(entry.name), dynamicKey(entry.id), dynamicKey(entry.item_key)]) {
      if (!key) continue;
      grouped[key] = [...(grouped[key] || []), member];
    }
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = uniqueMembers(grouped[key]).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }

  return grouped;
}

function fieldText(fields: FieldMap, meta: Record<string, unknown>, labels: string[]) {
  for (const label of labels) {
    const key = fieldKeyByLabel(fields, label);
    if (!key) continue;
    const value = meta[`${key}-value`] ?? meta[key];
    const text = cleanText(value);
    if (text) return text;
  }

  return "";
}

function fieldKeyByLabel(fields: FieldMap, label: string) {
  const target = dynamicKey(label);
  return Object.values(fields).find((field) => dynamicKey(field.name) === target)?.field_key;
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

function uniqueMembers(members: EditorialMember[]) {
  const seen = new Set<string>();
  return members.filter((member) => {
    const key = dynamicKey(`${member.role}-${member.name}-${member.affiliation}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasApiError(value: unknown): value is { code: string; message?: string } {
  return typeof value === "object" && value !== null && "code" in value;
}

function apiErrorMessage(value: unknown, status: number) {
  if (hasApiError(value)) return `${value.code}${value.message ? `: ${value.message}` : ""}`;
  return `HTTP ${status}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
