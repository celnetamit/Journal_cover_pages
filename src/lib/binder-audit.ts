// Binder QA / Audit engine.
//
// A self-contained, rule-based reviewer for a created binder. It takes the same
// (Journal, BinderDraft) pair the dashboard renders and produces a structured
// report modelled on the Journal Binder Quality Assurance checklist.
//
// This module is deliberately isomorphic (no "server-only", no React) so it can
// run both in the live editor (client, on the in-memory draft) and in the
// server-rendered /audit route (on the latest saved binder). It NEVER mutates
// its inputs and has no side effects — it only reads and reports.

import type { Journal } from "@/lib/journals";
import type { BinderDraft, ManagementPerson, ContentRow } from "@/lib/binder-content";
import type { EditorialMember } from "@/lib/formidable";
import { inlineToPlainText } from "@/lib/rich-text";

export type AuditStatus = "pass" | "fail" | "warn" | "manual" | "na";

export type AuditItem = {
  label: string;
  status: AuditStatus;
  /** What the checklist requires (standard). */
  requirement?: string;
  /** What the audit found, or why the status was chosen. */
  detail?: string;
};

export type AuditModule = {
  id: string;
  title: string;
  /** Optional note explaining scope (e.g. why items are manual). */
  note?: string;
  items: AuditItem[];
};

export type AuditSummaryRow = {
  label: string;
  status: AuditStatus;
};

export type AuditReport = {
  journalName: string;
  issueLabel: string;
  hasSavedBinder: boolean;
  modules: AuditModule[];
  summary: AuditSummaryRow[];
  counts: Record<AuditStatus, number>;
  readyForPublication: boolean;
};

// ---------------------------------------------------------------------------
// Small validators
// ---------------------------------------------------------------------------

/** Non-empty, trimmed string test that also strips inline rich-text tags. */
function present(value: string | null | undefined): boolean {
  return plain(value).length > 0;
}

function plain(value: string | null | undefined): string {
  return inlineToPlainText(value ?? "").trim();
}

/** First non-empty candidate (draft override → journal fallback). */
function first(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (present(candidate)) return plain(candidate);
  }
  return "";
}

/** ISSN format + mod-11 checksum (NNNN-NNNC, C ∈ 0-9 or X). */
export function isValidIssn(raw: string): boolean {
  const value = raw.trim().toUpperCase().replace(/[‒-―]/g, "-");
  if (!/^\d{4}-\d{3}[\dX]$/.test(value)) return false;
  const digits = value.replace("-", "");
  let sum = 0;
  for (let i = 0; i < 7; i += 1) sum += Number(digits[i]) * (8 - i);
  const check = digits[7] === "X" ? 10 : Number(digits[7]);
  return (sum + check) % 11 === 0;
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function isValidUrl(raw: string): boolean {
  const value = raw.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/.*)?$/i.test(value);
}

// Junk / placeholder / unresolved-editorial markers (Module 12 / 14). Each has a
// human label so the report can say what it detected. Exported so the PDF-level
// audit (binder-pdf-audit.ts) scans the assembled binder with the same list.
export const JUNK_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "repeated x placeholder (xxxx)", re: /x{4,}/i },
  { label: "unresolved ??? placeholder", re: /\?{3,}/ },
  { label: "lorem ipsum filler", re: /\blorem ipsum\b/i },
  { label: "the word 'placeholder'", re: /placeholder/i },
  { label: "TBD marker", re: /\bTBD\b/ },
  { label: "TODO marker", re: /\bTODO\b/ },
  { label: "author query (AQ)", re: /\bAQ\s*\d*\b/ },
  { label: "track-changes marker", re: /track\s*changes/i },
  { label: "replacement / mojibake character (�)", re: /�/ },
  { label: "highlight marker", re: /\bhighlight(ed)?\b/i },
];

// ---------------------------------------------------------------------------
// Field collection
// ---------------------------------------------------------------------------

type Ctx = {
  journal: Journal;
  draft: Partial<BinderDraft>;
  hasSavedBinder: boolean;
};

function managementPeople(draft: Partial<BinderDraft>): ManagementPerson[] {
  return [...(draft.managementHeads ?? []), ...(draft.managementMembers ?? [])];
}

// Every human-authored text value in the binder, labelled by where it lives, so
// the junk/placeholder scan can report a precise location.
function collectText(ctx: Ctx): Array<{ where: string; text: string }> {
  const { journal, draft } = ctx;
  const out: Array<{ where: string; text: string }> = [];
  const push = (where: string, text: string | null | undefined) => {
    const value = plain(text);
    if (value) out.push({ where, text: value });
  };

  push("Journal title", first(draft.journalTitle, journal.name));
  push("Abbreviation", first(draft.journalAbbreviation, journal.abbreviation, journal.shortName));
  (draft.focusScope ?? []).forEach((f, i) => push(`Focus & Scope #${i + 1}`, f));
  (draft.focusNotes ?? journal.focusNotes ?? []).forEach((f, i) => push(`Focus note #${i + 1}`, f));
  (draft.directorParagraphs ?? []).forEach((p, i) => push(`Director's Desk ¶${i + 1}`, p));
  (draft.editorialBoard ?? []).forEach((m: EditorialMember, i) => {
    push(`Editorial member #${i + 1} name`, m.name);
    push(`Editorial member #${i + 1} designation`, m.designation);
    push(`Editorial member #${i + 1} affiliation`, m.affiliation);
  });
  managementPeople(draft).forEach((m, i) => {
    push(`Management member #${i + 1} name`, m.name);
    push(`Management member #${i + 1} role`, m.role);
    push(`Management member #${i + 1} department`, m.department);
  });
  (draft.contentRows ?? []).forEach((r: ContentRow, i) => {
    push(`Contents row #${i + 1} title`, r.title);
    push(`Contents row #${i + 1} author`, r.author);
  });
  push("Publisher address", first(draft.publisherAddress, journal.salesAddress, journal.address));
  push("Registered office", first(draft.registeredOffice, journal.address));
  return out;
}

// ---------------------------------------------------------------------------
// Module builders
// ---------------------------------------------------------------------------

function moduleGeneral(ctx: Ctx): AuditModule {
  const { draft } = ctx;
  const items: AuditItem[] = [];

  const w = draft.coverPageWidthMm ?? 210;
  const h = draft.coverPageHeightMm ?? 297;
  const isA4 = w === 210 && h === 297;
  items.push({
    label: "Page size",
    requirement: "A4 (210 × 297 mm)",
    status: isA4 ? "pass" : "warn",
    detail: isA4 ? "Cover set to A4 (210 × 297 mm)." : `Cover page set to ${w} × ${h} mm — not standard A4.`,
  });
  items.push({
    label: "Orientation",
    requirement: "Portrait",
    status: h >= w ? "pass" : "warn",
    detail: h >= w ? "Portrait." : "Landscape — expected portrait.",
  });
  items.push({
    label: "Typography & margins",
    requirement: "Times New Roman body, A4 margins, single / 1.15 spacing",
    status: "pass",
    detail: "Applied by the fixed binder template (Times New Roman body, templated margins & spacing).",
  });
  items.push({
    label: "Total binder pages (even count)",
    requirement: "Even number",
    status: "manual",
    detail: "The initial-pages builder produces the front matter only; final page count depends on the article set — verify in the assembled binder.",
  });

  return {
    id: "general",
    title: "Module 1 · General binder specifications",
    note: "Physical print specs (binding, paper, CMYK) are manual production checks and are not software-verified.",
    items,
  };
}

function moduleFrontCover(ctx: Ctx): AuditModule {
  const { journal, draft } = ctx;
  const items: AuditItem[] = [];

  const title = first(draft.journalTitle, journal.name);
  items.push(reqItem("Journal title", title, "Present & matches metadata"));

  const abbr = first(draft.journalAbbreviation, journal.abbreviation, journal.shortName);
  items.push(reqItem("Journal abbreviation", abbr, "Present & matches metadata"));

  items.push(issueField("Volume", plain(draft.issueVolume)));
  items.push(issueField("Issue", plain(draft.issueNumber)));
  items.push(issueField("Month & Year", [plain(draft.issueMonthRange), plain(draft.issueYear)].filter(Boolean).join(" ")));

  const eIssn = first(draft.eIssn, journal.eIssn);
  items.push(issnField("Online ISSN", eIssn, false));
  items.push(issnField("Print ISSN", plain(journal.pIssn), false));

  const website = first(draft.journalWebsite, journal.website, journal.companyWebsite);
  items.push(urlField("Journal URL", website));

  items.push(imageItem("STM Journals / Publisher logo", first(draft.journalLogoImage, journal.publisherLogo)));
  items.push(imageItem("Centre / Cover image", first(draft.coverImage, journal.logo)));

  const sjif = first(draft.sjif, journal.impactFactor);
  items.push({
    label: "Impact Factor (if applicable)",
    requirement: "Shown when available",
    status: sjif ? "pass" : "na",
    detail: sjif ? `Impact factor: ${sjif}` : "No impact factor set — optional, hidden on the cover.",
  });

  return { id: "front-cover", title: "Module 2 · Front cover (Page 1)", items };
}

function moduleTitlePage(ctx: Ctx): AuditModule {
  const { journal, draft } = ctx;
  const items: AuditItem[] = [];

  const address = first(draft.publisherAddress, journal.salesAddress, journal.address);
  items.push(reqItem("Publisher address", address, "Present"));
  const registered = first(draft.registeredOffice, journal.address);
  items.push(reqItem("Registered office", registered, "Present"));
  items.push(urlField("Website", first(draft.publisherWebsite, journal.companyWebsite, journal.website)));
  items.push(emailField("Email", first(draft.publisherEmail, journal.publisherEmail)));

  const phone = first(draft.publisherPhone, journal.publisherPhone, journal.publisherMobile);
  items.push(reqItem("Phone number", phone, "Present"));

  const printer = first(draft.coverPrinter, journal.printedBy);
  items.push({
    label: "Printing information",
    requirement: "Present (if applicable)",
    status: printer ? "pass" : "na",
    detail: printer ? printer : "No printer set — optional.",
  });
  items.push({
    label: "CIN / registration",
    requirement: "Present (if applicable)",
    status: present(draft.cin) ? "pass" : "na",
    detail: present(draft.cin) ? plain(draft.cin) : "No CIN set — optional.",
  });

  return { id: "title-page", title: "Module 3 · Inside front cover / Title page (Page 2)", items };
}

function moduleJournalInfo(ctx: Ctx): AuditModule {
  const { journal, draft } = ctx;
  const items: AuditItem[] = [];

  const focus = (draft.focusScope ?? []).map(plain).filter(Boolean);
  items.push({
    label: "Aim & Scope / Focus",
    requirement: "Complete",
    status: focus.length ? "pass" : "fail",
    detail: focus.length ? `${focus.length} focus/scope entries.` : "No Focus & Scope entries set.",
  });
  items.push(reqItem("Publisher", first(journal.publisher, journal.imprint), "Present"));
  items.push(reqItem("Publication frequency", first(journal.frequency, journal.issuesPerYear), "Present"));
  items.push(reqItem("Language", journal.language, "Present"));
  items.push(urlField("Website", first(journal.website, journal.companyWebsite)));
  items.push(issnField("Online ISSN", first(draft.eIssn, journal.eIssn), true));
  items.push(issnField("Print ISSN", plain(journal.pIssn), true));
  items.push({
    label: "Indexing information",
    requirement: "Present",
    status: present(journal.indexing) ? "pass" : "warn",
    detail: present(journal.indexing) ? journal.indexing : "No indexing information set.",
  });

  return { id: "journal-info", title: "Module 4 · Journal information (Page 3)", items };
}

function moduleManagement(ctx: Ctx): AuditModule {
  const people = managementPeople(ctx.draft);
  const items: AuditItem[] = [];

  items.push({
    label: "Publication Management team present",
    requirement: "Complete list",
    status: people.length ? "pass" : "fail",
    detail: people.length ? `${people.length} member${people.length === 1 ? "" : "s"} listed.` : "No management team members listed.",
  });
  if (people.length) {
    const missingName = people.filter((p) => !present(p.name)).length;
    items.push({
      label: "Every member has a name",
      requirement: "Name for each member",
      status: missingName ? "fail" : "pass",
      detail: missingName ? `${missingName} member(s) missing a name.` : "All members named.",
    });
    const missingPhoto = people.filter((p) => !present(p.photo)).length;
    items.push({
      label: "Photographs supplied",
      requirement: "Photo for each member",
      status: missingPhoto === 0 ? "pass" : missingPhoto === people.length ? "fail" : "warn",
      detail: missingPhoto ? `${missingPhoto} of ${people.length} member(s) missing a photo.` : "All members have a photo.",
    });
    const missingRole = people.filter((p) => !present(p.role)).length;
    items.push({
      label: "Designations supplied",
      requirement: "Designation / department for each",
      status: missingRole ? "warn" : "pass",
      detail: missingRole ? `${missingRole} member(s) missing a designation.` : "All members have a designation.",
    });
  }
  items.push({
    label: "Equal image size & spacing / alignment",
    requirement: "Uniform grid",
    status: "pass",
    detail: "Management grid renders members at a uniform size & spacing by template.",
  });

  return { id: "management", title: "Module 5 · Publication Management team (Page 4)", items };
}

function moduleEditorial(ctx: Ctx): AuditModule {
  const board = ctx.draft.editorialBoard ?? [];
  const items: AuditItem[] = [];

  items.push({
    label: "Editorial board present",
    requirement: "Complete editorial hierarchy",
    status: board.length ? "pass" : "fail",
    detail: board.length ? `${board.length} board member${board.length === 1 ? "" : "s"} listed.` : "No editorial board members listed.",
  });
  if (board.length) {
    const hasChief = board.some((m) => /chief|editor.?in.?chief/i.test(`${m.role} ${m.designation}`));
    items.push({
      label: "Editor-in-Chief identified",
      requirement: "Editor-in-Chief present",
      status: hasChief ? "pass" : "warn",
      detail: hasChief ? "Editor-in-Chief found." : "No member is marked Editor-in-Chief.",
    });
    const names = board.map((m) => plain(m.name).toLowerCase()).filter(Boolean);
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    items.push({
      label: "No duplicate members",
      requirement: "Unique members",
      status: duplicates.length ? "warn" : "pass",
      detail: duplicates.length ? `Duplicate name(s): ${Array.from(new Set(duplicates)).join(", ")}.` : "No duplicate names.",
    });
    const missingAffiliation = board.filter((m) => !present(m.affiliation)).length;
    items.push({
      label: "Institution / country supplied",
      requirement: "Affiliation for each member",
      status: missingAffiliation ? "warn" : "pass",
      detail: missingAffiliation ? `${missingAffiliation} member(s) missing an affiliation.` : "All members have an affiliation.",
    });
  }

  return { id: "editorial", title: "Modules 6-7 · Advisory & Editorial Board (Pages 5-6)", items };
}

function moduleDirector(ctx: Ctx): AuditModule {
  const { draft } = ctx;
  const items: AuditItem[] = [];

  items.push(reqItem("Editorial / Director's Desk title", plain(draft.directorTitle), "Present"));
  const paras = (draft.directorParagraphs ?? []).map(plain).filter(Boolean);
  items.push({
    label: "Editorial message",
    requirement: "Present",
    status: paras.length ? "pass" : "fail",
    detail: paras.length ? `${paras.length} paragraph(s).` : "No director's letter content.",
  });
  items.push(reqItem("Director / Editor name", plain(draft.directorName), "Present"));
  items.push({
    label: "Photograph (if applicable)",
    requirement: "Optional",
    status: present(draft.directorPhotoImage) ? "pass" : "na",
    detail: present(draft.directorPhotoImage) ? "Photo supplied." : "No photo — optional.",
  });
  items.push({
    label: "Signature (if applicable)",
    requirement: "Optional",
    status: present(draft.directorSignatureImage) ? "pass" : "na",
    detail: present(draft.directorSignatureImage) ? "Signature supplied." : "No signature — optional.",
  });

  return { id: "director", title: "Module 8 · Director's Desk / Editorial (Page 7)", items };
}

function moduleContents(ctx: Ctx): AuditModule {
  const rows = ctx.draft.contentRows ?? [];
  const items: AuditItem[] = [];

  items.push({
    label: "Table of Contents populated",
    requirement: "Article titles, authors & pages listed",
    status: rows.length ? "pass" : "fail",
    detail: rows.length ? `${rows.length} article row(s).` : "No contents rows — the Table of Contents is empty.",
  });

  if (rows.length) {
    const missingTitle = rows.filter((r) => !present(r.title)).length;
    items.push({
      label: "Every row has an article title",
      requirement: "Title for each row",
      status: missingTitle ? "fail" : "pass",
      detail: missingTitle ? `${missingTitle} row(s) missing a title.` : "All rows titled.",
    });
    const missingAuthor = rows.filter((r) => present(r.title) && !present(r.author)).length;
    items.push({
      label: "Every row has author name(s)",
      requirement: "Author(s) for each row",
      status: missingAuthor ? "warn" : "pass",
      detail: missingAuthor ? `${missingAuthor} row(s) missing author(s).` : "All rows have authors.",
    });

    const pages = rows
      .map((r) => ({ raw: plain(r.page), num: Number.parseInt(plain(r.page), 10) }))
      .filter((p) => p.raw.length > 0);
    const nonNumeric = pages.filter((p) => !Number.isFinite(p.num)).length;
    items.push({
      label: "Starting page numbers valid",
      requirement: "Numeric page numbers",
      status: pages.length === 0 ? "fail" : nonNumeric ? "warn" : "pass",
      detail:
        pages.length === 0
          ? "No page numbers supplied."
          : nonNumeric
            ? `${nonNumeric} row(s) have a non-numeric page.`
            : "All page numbers numeric.",
    });

    const nums = pages.map((p) => p.num).filter((n) => Number.isFinite(n));
    let ascending = true;
    for (let i = 1; i < nums.length; i += 1) if (nums[i] < nums[i - 1]) ascending = false;
    items.push({
      label: "Sequential page order maintained",
      requirement: "Ascending, sequential",
      status: nums.length < 2 ? "na" : ascending ? "pass" : "warn",
      detail: nums.length < 2 ? "Not enough rows to assess order." : ascending ? "Pages ascend in order." : "Page numbers are not in ascending order.",
    });
  }

  return {
    id: "contents",
    title: "Module 9 · Table of Contents (Page 8)",
    note: "DOI is not verified in the Table of Contents (per checklist).",
    items,
  };
}

function moduleArticles(): AuditModule {
  return {
    id: "articles",
    title: "Modules 10-11 · Article & manuscript formatting",
    note: "Individual article PDFs are assembled outside this initial-pages builder.",
    items: [
      {
        label: "Per-article first page, headers, footers, references, figures & tables",
        requirement: "Full article-level checklist",
        status: "manual",
        detail: "Article bodies are not produced by this builder — verify them against the article checklist in the assembled binder.",
      },
    ],
  };
}

function moduleEditorialValidation(ctx: Ctx): AuditModule {
  const items: AuditItem[] = [];
  const texts = collectText(ctx);
  const hits: string[] = [];
  for (const { where, text } of texts) {
    for (const { label, re } of JUNK_PATTERNS) {
      if (re.test(text)) hits.push(`${where}: ${label}`);
    }
  }
  items.push({
    label: "No junk / placeholder / query text",
    requirement: "No xxxx, ?????, placeholders, AQ, track-changes or highlight markers",
    status: hits.length ? "fail" : "pass",
    detail: hits.length ? `${hits.length} issue(s): ${hits.slice(0, 6).join("; ")}${hits.length > 6 ? "…" : ""}` : "No placeholder or unresolved-editorial markers detected.",
  });
  items.push({
    label: "Image quality (≥300 dpi) & no distorted/missing images",
    requirement: "Print-quality images",
    status: "manual",
    detail: "Image resolution and distortion are verified visually in the assembled binder.",
  });
  return { id: "editorial-validation", title: "Module 12 · Editorial & production validation", items };
}

function moduleCrossVerification(ctx: Ctx): AuditModule {
  const { journal, draft } = ctx;
  const items: AuditItem[] = [];

  // The binder is generated from a single source draft, so volume/issue/ISSN/DOI
  // are inherently identical on every page — record that explicitly.
  items.push({
    label: "Volume / Issue / ISSN / DOI consistent across pages",
    requirement: "Identical throughout",
    status: "pass",
    detail: "All pages derive from one issue record, so these values are single-sourced and consistent by construction.",
  });

  const rows = draft.contentRows ?? [];
  const dupeTitles = (() => {
    const titles = rows.map((r) => plain(r.title).toLowerCase()).filter(Boolean);
    return titles.filter((t, i) => titles.indexOf(t) !== i);
  })();
  items.push({
    label: "No duplicate contents entries",
    requirement: "No duplicate rows",
    status: dupeTitles.length ? "warn" : "pass",
    detail: dupeTitles.length ? `Duplicate title(s): ${Array.from(new Set(dupeTitles)).join(", ")}.` : "No duplicate contents rows.",
  });

  const doi = plain(journal.doi);
  items.push({
    label: "DOI prefix set",
    requirement: "Journal DOI prefix present",
    status: doi ? "pass" : "warn",
    detail: doi ? doi : "No DOI prefix set on the journal.",
  });

  const isInternational = /international/i.test(journal.type);
  const mentionsStm = /stm\s*journals/i.test(`${journal.publisher} ${journal.imprint}`);
  items.push({
    label: '"Published by STM Journals" for International journals',
    requirement: "Required for International journals",
    status: !isInternational ? "na" : mentionsStm ? "pass" : "warn",
    detail: !isInternational
      ? `Publication type is ${journal.type || "unspecified"} — not International.`
      : mentionsStm
        ? "International journal published by STM Journals."
        : "International journal but publisher is not STM Journals — confirm the imprint line.",
  });

  items.push({
    label: "Continuous page numbering / no missing pages",
    requirement: "Continuous, no gaps",
    status: "manual",
    detail: "Cross-page numbering is verified in the assembled binder (front matter + articles).",
  });

  return { id: "cross-verification", title: "Module 14 · Cross verification", items };
}

// ---------------------------------------------------------------------------
// Shared item builders
// ---------------------------------------------------------------------------

function reqItem(label: string, value: string, requirement: string): AuditItem {
  const ok = present(value);
  return {
    label,
    requirement,
    status: ok ? "pass" : "fail",
    detail: ok ? value : "Missing.",
  };
}

// Issue metadata (volume/issue/month-year) blank means the cover renders a
// hard-coded fallback that is almost certainly wrong for this issue → fail.
function issueField(label: string, value: string): AuditItem {
  const ok = value.length > 0;
  return {
    label,
    requirement: "Set for this issue",
    status: ok ? "pass" : "fail",
    detail: ok ? value : "Not set — the cover falls back to a default value. Set the issue metadata.",
  };
}

function issnField(label: string, value: string, required: boolean): AuditItem {
  if (!value) {
    return {
      label,
      requirement: required ? "Present & valid" : "Valid when present",
      status: required ? "warn" : "na",
      detail: required ? "Not set." : "Not set — optional.",
    };
  }
  const valid = isValidIssn(value);
  return {
    label,
    requirement: "Valid ISSN (NNNN-NNNC)",
    status: valid ? "pass" : "fail",
    detail: valid ? `${value} (valid checksum).` : `${value} — invalid ISSN format or checksum.`,
  };
}

function emailField(label: string, value: string): AuditItem {
  if (!value) return { label, requirement: "Present & valid", status: "warn", detail: "Not set." };
  const valid = isValidEmail(value);
  return {
    label,
    requirement: "Valid email",
    status: valid ? "pass" : "fail",
    detail: valid ? value : `${value} — invalid email format.`,
  };
}

function urlField(label: string, value: string): AuditItem {
  if (!value) return { label, requirement: "Present & valid", status: "warn", detail: "Not set." };
  const valid = isValidUrl(value);
  return {
    label,
    requirement: "Valid URL",
    status: valid ? "pass" : "fail",
    detail: valid ? value : `${value} — does not look like a valid URL.`,
  };
}

function imageItem(label: string, value: string): AuditItem {
  const ok = present(value);
  return {
    label,
    requirement: "Image supplied",
    status: ok ? "pass" : "warn",
    detail: ok ? "Image set." : "No image set.",
  };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

// Worst status wins for a module's summary row: fail > warn > (pass) > manual > na.
// Exported for the PDF-level audit, which builds reports of the same shape.
export function summarize(mod: AuditModule): AuditStatus {
  const statuses = mod.items.map((i) => i.status);
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  if (statuses.includes("pass")) return "pass";
  if (statuses.includes("manual")) return "manual";
  return "na";
}

function issueLabelFor(ctx: Ctx): string {
  const { draft } = ctx;
  const volume = plain(draft.issueVolume);
  const issue = plain(draft.issueNumber);
  const month = plain(draft.issueMonthRange);
  const year = plain(draft.issueYear);
  const parts: string[] = [];
  if (volume) parts.push(`Volume ${volume}`);
  if (issue) parts.push(`Issue ${issue}`);
  const when = [month, year].filter(Boolean).join(" ");
  if (when) parts.push(when);
  return parts.length ? parts.join(" · ") : "Issue metadata not set";
}

/**
 * Run the full QA audit for one binder.
 *
 * @param journal The journal record.
 * @param draft   The binder draft (in-memory or saved). `null` means no issue
 *                has been created yet — the audit still runs against the journal
 *                record and flags the missing issue-level data.
 */
export function auditBinder(
  journal: Journal,
  draft: BinderDraft | null,
  opts: { hasSavedBinder?: boolean } = {},
): AuditReport {
  const ctx: Ctx = {
    journal,
    draft: draft ?? {},
    hasSavedBinder: opts.hasSavedBinder ?? draft != null,
  };

  const modules: AuditModule[] = [
    moduleGeneral(ctx),
    moduleFrontCover(ctx),
    moduleTitlePage(ctx),
    moduleJournalInfo(ctx),
    moduleManagement(ctx),
    moduleEditorial(ctx),
    moduleDirector(ctx),
    moduleContents(ctx),
    moduleArticles(),
    moduleEditorialValidation(ctx),
    moduleCrossVerification(ctx),
  ];

  const counts: Record<AuditStatus, number> = { pass: 0, fail: 0, warn: 0, manual: 0, na: 0 };
  for (const mod of modules) {
    for (const item of mod.items) counts[item.status] += 1;
  }

  const summary: AuditSummaryRow[] = modules.map((mod) => ({
    label: mod.title.replace(/^Modules?\s[\d-]+\s·\s/, ""),
    status: summarize(mod),
  }));

  return {
    journalName: plain(first(draft?.journalTitle, journal.name)),
    issueLabel: issueLabelFor(ctx),
    hasSavedBinder: ctx.hasSavedBinder,
    modules,
    summary,
    counts,
    readyForPublication: counts.fail === 0,
  };
}
