import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Legacy flat shape consumed by the dashboard + formatting helpers. Kept stable
// so the binder UI is unaffected; the data now comes from Postgres, not CSV.
// A person shown in the management-page contact boxes (sourced from a Profile).
export type ContactPerson = {
  name: string;
  designation: string;
  phone: string;
  email: string;
  photo: string;
};

export type Journal = {
  id: string;
  domain: string;
  domainLogo: string;
  name: string;
  abbreviation: string;
  shortName: string;
  website: string;
  logo: string;
  coverBack: string;
  publisherLogo: string;
  companyLogo: string;
  publisherSeal: string;
  publisherAbout: string;
  objectives: string[];
  salientFeatures: string[];
  manuscriptUrl: string;
  editorialBoardUrl: string;
  focusNotes: string[];
  // Director's Desk — shared via the journal's Company (+ its director Profile).
  directorName: string;
  directorRole: string;
  directorPhoto: string;
  directorSignature: string;
  directorDeskTitle: string;
  directorDeskParagraphs: string[];
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
  // Management-page contact boxes (profiles selected on the journal/publisher).
  journalManager: ContactPerson;
  dispatchManager: ContactPerson;
  subscriptionManager: ContactPerson;
  // When set on the publisher, the management page lists its journals (2 cols).
  showPublisherJournals: boolean;
  publisherJournalNames: string[];
};

const DEFAULT_EDITOR_NAME = "Gaurav Tiwari";
const DEFAULT_EDITOR_PHONE = "0120-4746259";
const DEFAULT_EDITOR_EMAIL = "info@mbajournals.in";

// Query shape for the relations we flatten into the legacy Journal.
const journalInclude = {
  domain: true,
  publisher: {
    include: {
      company: { include: { director: true } },
      subscriptionManager: true,
      dispatchManager: true,
      journals: { select: { name: true }, orderBy: { name: "asc" } },
    },
  },
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

// Map a Profile (or null) into a contact-box person.
type ProfileLike = { name: string; designation: string | null; phone: string | null; email: string | null; photoUrl: string | null } | null | undefined;
function toContactPerson(p: ProfileLike): ContactPerson {
  return {
    name: s(p?.name),
    designation: s(p?.designation),
    phone: s(p?.phone),
    email: s(p?.email),
    photo: s(p?.photoUrl),
  };
}

export function toLegacyJournal(j: DbJournal): Journal {
  const company = j.publisher?.company ?? null;
  return {
    id: j.id,
    domain: s(j.domain?.name),
    domainLogo: s(j.domain?.logoUrl),
    name: j.name,
    abbreviation: j.abbreviation,
    shortName: s(j.shortName),
    website: s(j.website),
    logo: s(j.coverFrontUrl),
    coverBack: s(j.coverBackUrl),
    publisherLogo: s(j.publisher?.logoUrl),
    companyLogo: s(company?.logoUrl),
    publisherSeal: s(j.publisher?.sealUrl),
    publisherAbout: s(j.publisher?.about),
    // Objectives are publisher-wide now (shared by all the publisher's journals).
    objectives: j.publisher?.objectives ?? [],
    // Salient features are publisher-wide now (shared by all the publisher's journals).
    salientFeatures: j.publisher?.salientFeatures ?? [],
    manuscriptUrl: s(j.manuscriptUrl),
    editorialBoardUrl: s(j.editorialBoardUrl),
    focusNotes: j.focusNotes,
    // Name/role/photo/signature stay sourced from the Company's director Profile.
    directorName: s(company?.director?.name),
    directorRole: s(company?.director?.designation),
    directorPhoto: s(company?.director?.photoUrl),
    directorSignature: s(company?.director?.signatureUrl),
    // The Director's Desk message (heading + letter) is per-journal: it maps ONLY
    // from the journal record — no Company fallback. Blank is surfaced as a flag.
    directorDeskTitle: s(j.directorDeskTitle),
    directorDeskParagraphs: j.directorDeskParagraphs,
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
    journalManager: toContactPerson(j.manager),
    dispatchManager: toContactPerson(j.publisher?.dispatchManager),
    subscriptionManager: toContactPerson(j.publisher?.subscriptionManager),
    showPublisherJournals: j.publisher?.showJournalsOnManagement ?? false,
    publisherJournalNames: (j.publisher?.journals ?? []).map((x) => x.name),
  };
}

// Memoized per request render pass.
export const getJournals = cache(async (): Promise<Journal[]> => {
  const rows = await fetchJournals();
  return rows.map(toLegacyJournal);
});

export const targetJournalName = "Journal of Advanced Database Management & Systems";
