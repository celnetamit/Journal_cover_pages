import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Legacy flat shape consumed by the dashboard + formatting helpers. Kept stable
// so the binder UI is unaffected; the data now comes from Postgres, not CSV.
export type Journal = {
  id: string;
  domain: string;
  name: string;
  abbreviation: string;
  shortName: string;
  website: string;
  logo: string;
  coverBack: string;
  journalLogo: string;
  publisherLogo: string;
  companyLogo: string;
  about: string;
  publisherAbout: string;
  objectives: string[];
  salientFeatures: string[];
  manuscriptNotice: string;
  manuscriptUrl: string;
  focusNotes: string[];
  // Director's Desk — shared via the journal's Company (+ its director Profile).
  directorName: string;
  directorRole: string;
  directorPhoto: string;
  directorSignature: string;
  directorDeskTitle: string;
  directorDeskParagraphs: string[];
  // Page 5 contact boxes — shared via the Company.
  dispatchContactName: string;
  dispatchContactPhone: string;
  dispatchContactEmail: string;
  salesContactName: string;
  salesContactPhone: string;
  salesContactEmail: string;
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
  salesAddress: string;
  companyWebsite: string;
  printedBy: string;
  publisherEmail: string;
  publisherPhone: string;
  editorName: string;
  editorPhone: string;
  editorEmail: string;
};

const DEFAULT_EDITOR_NAME = "Gaurav Tiwari";
const DEFAULT_EDITOR_PHONE = "0120-4746259";
const DEFAULT_EDITOR_EMAIL = "info@mbajournals.in";

// Query shape for the relations we flatten into the legacy Journal.
const journalInclude = {
  domain: true,
  publisher: { include: { company: { include: { director: true } } } },
  manager: true,
} as const;

type DbJournal = Awaited<ReturnType<typeof fetchJournals>>[number];

function fetchJournals() {
  return prisma.journal.findMany({
    include: journalInclude,
    orderBy: { name: "asc" },
  });
}

function s(value: string | null | undefined): string {
  return value ?? "";
}

export function toLegacyJournal(j: DbJournal): Journal {
  const company = j.publisher?.company ?? null;
  return {
    id: j.id,
    domain: s(j.domain?.name),
    name: j.name,
    abbreviation: j.abbreviation,
    shortName: s(j.shortName),
    website: s(j.website),
    logo: s(j.coverFrontUrl),
    coverBack: s(j.coverBackUrl),
    journalLogo: s(j.logoUrl),
    publisherLogo: s(j.publisher?.logoUrl),
    companyLogo: s(company?.logoUrl),
    about: s(j.about),
    publisherAbout: s(j.publisher?.about),
    objectives: j.objectives,
    salientFeatures: j.salientFeatures,
    manuscriptNotice: s(j.manuscriptNotice),
    manuscriptUrl: s(j.manuscriptUrl),
    focusNotes: j.focusNotes,
    directorName: s(company?.director?.name),
    directorRole: s(company?.director?.designation),
    directorPhoto: s(company?.director?.photoUrl),
    directorSignature: s(company?.director?.signatureUrl),
    directorDeskTitle: s(j.directorDeskTitle) || s(company?.directorDeskTitle),
    directorDeskParagraphs: j.directorDeskParagraphs.length ? j.directorDeskParagraphs : (company?.directorDeskParagraphs ?? []),
    dispatchContactName: s(company?.dispatchContactName),
    dispatchContactPhone: s(company?.dispatchContactPhone),
    dispatchContactEmail: s(company?.dispatchContactEmail),
    salesContactName: s(company?.salesContactName),
    salesContactPhone: s(company?.salesContactPhone),
    salesContactEmail: s(company?.salesContactEmail),
    eIssn: s(j.issnOnline),
    pIssn: s(j.issnPrint),
    impactFactor: s(j.impactFactor),
    indexing: j.indexing.join(", "),
    icv: s(j.icv),
    startedSince: s(j.startedSince),
    type: s(j.typeOfPublication),
    access: s(j.access),
    language: s(j.language),
    issuesPerYear: j.issuesPerYear != null ? String(j.issuesPerYear) : "",
    frequency: s(j.frequencyLabel),
    doi: s(j.doi),
    publisher: s(j.publisher?.name),
    imprint: s(company?.name),
    address: s(company?.registeredAddress),
    salesAddress: s(company?.salesAddress),
    companyWebsite: s(company?.website),
    printedBy: s(company?.printedBy),
    publisherEmail: s(company?.email),
    publisherPhone: s(company?.phone),
    editorName: j.manager?.name || DEFAULT_EDITOR_NAME,
    editorPhone: DEFAULT_EDITOR_PHONE,
    editorEmail: j.manager?.email || DEFAULT_EDITOR_EMAIL,
  };
}

// Memoized per request render pass.
export const getJournals = cache(async (): Promise<Journal[]> => {
  const rows = await fetchJournals();
  return rows.map(toLegacyJournal);
});

export const targetJournalName = "Journal of Advanced Database Management & Systems";
