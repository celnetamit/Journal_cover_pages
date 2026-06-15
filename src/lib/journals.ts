import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "@/lib/csv";

export type Journal = {
  id: string;
  domain: string;
  name: string;
  abbreviation: string;
  shortName: string;
  website: string;
  indexingLogo: string;
  logo: string;
  journalLogo: string;
  about: string;
  eIssn: string;
  pIssn: string;
  impactFactor: string;
  indexing: string;
  icv: string;
  startedSince: string;
  type: string;
  access: string;
  language: string;
  issuesPerYear: string;
  frequency: string;
  doi: string;
  publisher: string;
  imprint: string;
  address: string;
  publisherEmail: string;
  publisherPhone: string;
  editorName: string;
  editorPhone: string;
  editorEmail: string;
};

const csvPath = path.join(process.cwd(), "journals_list.csv");

function text(value: string | undefined) {
  return (value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let cachedJournals: Journal[] | null = null;

export function getJournals(): Journal[] {
  if (cachedJournals) return cachedJournals;
  const raw = fs.readFileSync(csvPath, "utf8");
  const [headers, ...rows] = parseCsv(raw);
  const headerIndex = new Map(headers.map((header, index) => [header.trim(), index]));
  const pick = (row: string[], key: string) => text(row[headerIndex.get(key) ?? -1]);

  cachedJournals = rows
    .map((row) => ({
      id: pick(row, "ID") || pick(row, "Key") || pick(row, "Abbreviation"),
      domain: pick(row, "Domain"),
      name: pick(row, "Journal Name"),
      abbreviation: pick(row, "Abbreviation").toUpperCase(),
      shortName: pick(row, "Short Name"),
      website: pick(row, "Journal Website/URL"),
      indexingLogo: pick(row, "Indexing Logo Img"),
      journalLogo: pick(row, "Journal Logo URL"),
      logo: pick(row, "Journal Image URL") || pick(row, "Journal Image/Logo"),
      about: pick(row, "About Journal"),
      eIssn: pick(row, "e-ISSN"),
      pIssn: pick(row, "p-ISSN"),
      impactFactor: pick(row, "Impact Factor"),
      indexing: pick(row, "Indexing"),
      icv: pick(row, "ICV Value"),
      startedSince: pick(row, "Started Since"),
      type: pick(row, "Type of Publication"),
      access: pick(row, "Type of Access"),
      language: pick(row, "Language"),
      issuesPerYear: pick(row, "Issues Per Year"),
      frequency: pick(row, "Frequency"),
      doi: pick(row, "Journal DOI Number"),
      publisher: pick(row, "Publisher"),
      imprint: pick(row, "Imprint"),
      address: pick(row, "Address"),
      publisherEmail: pick(row, "Publisher Email"),
      publisherPhone: pick(row, "Publisher Contact Number"),
      editorName: pick(row, "JM Name") || "Gaurav Tiwari",
      editorPhone: pick(row, "JM Number") || "0120-4746259",
      editorEmail: pick(row, "Jm Email") || "info@mbajournals.in",
    }))
    .filter((journal) => journal.id && journal.name);
  return cachedJournals;
}

export const targetJournalName = "Journal of Advanced Database Management & Systems";
