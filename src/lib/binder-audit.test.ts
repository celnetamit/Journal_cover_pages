import { describe, it, expect } from "vitest";
import { auditBinder, isValidIssn, isValidEmail, isValidUrl } from "@/lib/binder-audit";
import type { Journal } from "@/lib/journals";
import type { BinderDraft } from "@/lib/binder-content";

function makeJournal(overrides: Partial<Journal> = {}): Journal {
  return {
    id: "j1",
    domain: "",
    domainLogo: "",
    name: "Journal of Testing",
    abbreviation: "JOT",
    shortName: "Testing",
    website: "www.jot.example.com",
    logo: "",
    coverBack: "",
    publisherLogo: "",
    companyLogo: "",
    publisherSeal: "",
    publisherAbout: "",
    publisherDisciplines: "",
    objectives: [],
    salientFeatures: [],
    manuscriptUrl: "",
    editorialBoardUrl: "",
    focusNotes: [],
    directorName: "",
    directorRole: "",
    directorPhoto: "",
    directorSignature: "",
    directorDeskTitle: "",
    directorDeskParagraphs: [],
    eIssn: "2049-3630",
    pIssn: "",
    impactFactor: "",
    indexing: "",
    icv: "",
    startedSince: "",
    type: "National Journal",
    access: "",
    language: "English",
    issuesPerYear: "4",
    frequency: "Quarterly",
    doi: "10.1234",
    publisher: "STM Journals",
    imprint: "Consortium e-Learning Network Pvt. Ltd.",
    address: "Somewhere",
    salesAddress: "Sales office",
    companyWebsite: "www.stmjournals.com",
    printedBy: "",
    publisherEmail: "info@stmjournals.com",
    publisherPhone: "0120-000",
    publisherMobile: "",
    editorName: "",
    editorPhone: "",
    editorEmail: "",
    journalManager: { name: "", designation: "", phone: "", email: "", photo: "" },
    dispatchManager: { name: "", designation: "", phone: "", email: "", photo: "" },
    subscriptionManager: { name: "", designation: "", phone: "", email: "", photo: "" },
    showPublisherJournals: false,
    publisherJournalNames: [],
    ...overrides,
  };
}

describe("ISSN validation", () => {
  it("accepts a valid ISSN checksum", () => {
    expect(isValidIssn("2049-3630")).toBe(true);
    expect(isValidIssn("0378-5955")).toBe(true);
  });
  it("rejects a bad checksum or malformed value", () => {
    expect(isValidIssn("1234-5678")).toBe(false);
    expect(isValidIssn("12345678")).toBe(false);
    expect(isValidIssn("abcd-efgh")).toBe(false);
  });
});

describe("email & url validation", () => {
  it("validates emails", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
  });
  it("validates urls (bare domains ok)", () => {
    expect(isValidUrl("www.example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path")).toBe(true);
    expect(isValidUrl("not a url")).toBe(false);
  });
});

describe("auditBinder", () => {
  it("flags a null draft's missing issue metadata as failures", () => {
    const report = auditBinder(makeJournal(), null, { hasSavedBinder: false });
    expect(report.hasSavedBinder).toBe(false);
    expect(report.counts.fail).toBeGreaterThan(0);
    expect(report.readyForPublication).toBe(false);
    // Volume must be flagged as a failing item somewhere.
    const front = report.modules.find((m) => m.id === "front-cover")!;
    expect(front.items.find((i) => i.label === "Volume")?.status).toBe("fail");
  });

  it("detects junk/placeholder text in editorial validation", () => {
    const draft = { journalTitle: "Journal of xxxxx Studies" } as unknown as BinderDraft;
    const report = auditBinder(makeJournal(), draft);
    const validation = report.modules.find((m) => m.id === "editorial-validation")!;
    const junk = validation.items.find((i) => i.label.startsWith("No junk"));
    expect(junk?.status).toBe("fail");
  });

  it("passes core cover checks when issue metadata & valid data are present", () => {
    const draft = {
      journalTitle: "Journal of Testing",
      journalAbbreviation: "JOT",
      issueVolume: "13",
      issueNumber: "1",
      issueMonthRange: "January–April",
      issueYear: "2026",
      eIssn: "2049-3630",
      journalWebsite: "www.jot.example.com",
      journalLogoImage: "/logo.png",
      coverImage: "/cover.png",
    } as unknown as BinderDraft;
    const report = auditBinder(makeJournal(), draft);
    const front = report.modules.find((m) => m.id === "front-cover")!;
    expect(front.items.find((i) => i.label === "Volume")?.status).toBe("pass");
    expect(front.items.find((i) => i.label === "Online ISSN")?.status).toBe("pass");
    expect(front.items.find((i) => i.label === "Journal URL")?.status).toBe("pass");
  });
});
