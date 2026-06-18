"use client";

import Image from "next/image";
import { createContext, startTransition, useContext, useEffect, useMemo, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  Printer,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import FrontCoverCanvas from "@/components/FrontCoverCanvas";
import { dynamicKey, journalLookupKeys } from "@/lib/lookup";
import type { DynamicBinderData, EditorialMember } from "@/lib/formidable";
import type { Journal } from "@/lib/journals";
import { proxiedImage } from "@/lib/image";
import type { LegalInfo } from "@/lib/legal-data";
import Page3Editor from "@/components/Page3Editor";
import SaveFocusToJournal from "@/components/SaveFocusToJournal";
import { exportBookToPdf, type ExportMode } from "@/lib/pdf-export";
import {
  cleanIcv,
  compactKeyword,
  frontCoverTitleClass,
  initials,
  isLawJournal,
  lowerRoman,
  titleCaseName,
} from "@/lib/binder-format";
import {
  type BinderDraft,
  defaultBinderPageLayouts,
  defaultFrontCoverLayout,
  type ManagementPerson,
  type ContentRow,
  boardMembers,
  contents,
  focusList,
  objectives,
  salientFeatures,
  lawObjectives,
  lawSalientFeatures,
  lawJournalNames,
  managementMembers,
  lawManagementMembers,
  defaultPage5Contacts,
  subscriptionPlans,
  defaultDirectorParagraphs,
  lawDirectorParagraphs,
  defaultFocusNotes,
  defaultManuscriptNotice,
  logoAssets,
  normalizeBinderPageLayouts,
  normalizeFrontCoverLayout,
} from "@/lib/binder-content";

type StoredDraft = {
  binderId: string;
  draft: BinderDraft;
  updatedAt: string;
  updatedByName: string | null;
};

type BinderSummary = {
  id: string;
  volume: string | null;
  issue: string | null;
  year: number | null;
  type: string;
  monthRange: string | null;
  updatedAt: string;
  updatedByName: string | null;
};

type ConflictState = {
  journalId: string;
  draft: BinderDraft;
  updatedAt: string;
  updatedByName: string | null;
};

type ProfilePick = { id: string; name: string; role: string; photo: string };

// Per-journal legal/subscription data for Page 3, provided via context so the
// page render components can read it without prop-threading through BinderPage.
const LegalContext = createContext<Record<string, LegalInfo>>({});

type Props = {
  journals: Journal[];
  defaultJournalId: string;
  dynamicData: DynamicBinderData;
  serverDrafts: Record<string, StoredDraft>;
  canEdit: boolean;
  profiles: ProfilePick[];
  legalData: Record<string, LegalInfo>;
};



const defaultIssueVolume = "13";
const defaultIssueNumber = "1";
const defaultIssueMonthRange = "January-April";
const defaultIssueYear = "2026";
const totalPages = 9;
const defaultCoverPrinter = "Laxman Printo Graphics, Noida";
const defaultRegisteredOffice =
  "Office No. 4, First Floor, CSC Pocket-E Market, Mayur Vihar, Phase-I, New Delhi-110091";
const defaultCin = "U80302DL2005PTC138759";
const maxFocusScopeKeywords = 10;

function pageStepperLabel(page: number) {
  if (page === 1) return "Cover Spread";
  if (page === 2) return "Title Page";
  return `Page ${page}`;
}




function findDynamicValue<T>(journal: Journal, map: Record<string, T>) {
  for (const key of journalLookupKeys(journal)) {
    const value = map[key];
    if (value) return value;
  }
}


function defaultBackCoverImage() {
  return "/brand/stm-digital-library-back.png";
}

function defaultCoverWebsite(journal: Journal) {
  return publisherIdentity(journal).website;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pageDensityScale(contentLength: number, idealLength: number, min = 0.88, max = 1.12) {
  if (contentLength <= 0 || idealLength <= 0) return 1;
  return Number(clamp(Math.sqrt(idealLength / contentLength), min, max).toFixed(3));
}

function pageStyle(scale: number): CSSProperties {
  return { ["--page-scale" as never]: scale };
}

function normalizeCoverWebsite(value: string | undefined, journal: Journal) {
  // Strip protocol and trailing slashes but keep any path — a path-based URL is
  // still valid for the cover and should not be silently replaced.
  const cleaned = (value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "");

  if (!cleaned) return defaultCoverWebsite(journal);
  return cleaned;
}

function defaultCoverImage(journal: Journal) {
  // Prefer the journal's own cover image from the database (proxied so remote
  // URLs still export to PDF). Fall back to the curated publisher templates.
  if (journal.logo) return proxiedImage(journal.logo);
  if ((journal.abbreviation || "").toLowerCase() === "joadms") return "/brand/joadms-pdf-front.png";
  const identity = publisherIdentity(journal);
  if (identity.logoMode === "mba") return "/brand/mba-journals.jpeg";
  if (identity.logoMode === "law") return "/brand/law-journals.jpeg";
  if (identity.logoMode === "journalspub") return "/brand/journalspub.jpg";
  if (identity.logoMode === "stm") return "/brand/stm-journals.jpg";
  return journal.logo;
}


function focusKeywords(focus: { keywords?: string[]; focusScope?: string[] } | undefined, fallback: string[]) {
  const preferred = (focus?.keywords || [])
    .map(compactKeyword)
    .filter(Boolean);

  if (preferred.length > 0) return preferred;

  return (focus?.focusScope || fallback)
    .map(compactKeyword)
    .filter(Boolean);
}

function normalizeFocusScopeInput(value: string) {
  return value
    .split("\n")
    .map((item) => compactKeyword(item))
    .filter(Boolean)
    .slice(0, maxFocusScopeKeywords);
}

function focusScopeItemsForPage(draft: BinderDraft) {
  const draftItems = (draft.focusScope || [])
    .map(compactKeyword)
    .filter(Boolean);
  const fallbackItems = focusList.map(compactKeyword).filter(Boolean);
  const merged: string[] = [];

  for (const item of draftItems) {
    if (!merged.includes(item)) merged.push(item);
    if (merged.length >= maxFocusScopeKeywords) return merged.slice(0, maxFocusScopeKeywords);
  }

  for (const item of fallbackItems) {
    if (!merged.includes(item)) merged.push(item);
    if (merged.length >= maxFocusScopeKeywords) break;
  }

  return merged.slice(0, maxFocusScopeKeywords);
}

function defaultDirectorDesk(journal: Journal) {
  return {
    title: isLawJournal(journal) ? "Director's Desk" : "From the Director's Desk",
    name: "Puneet Mehrotra",
    role: isLawJournal(journal) ? "Chairman & Director, Law Journals" : "Managing Director",
    paragraphs: isLawJournal(journal) ? lawDirectorParagraphs : defaultDirectorParagraphs,
  };
}

function hasDirectorContent(paragraphs: string[] | undefined) {
  return (paragraphs || []).some((paragraph) => paragraph.trim());
}

function directorParagraphsForJournal(journal: Journal, draft: BinderDraft) {
  const defaults = defaultDirectorDesk(journal).paragraphs;
  return defaults.map((paragraph, index) => draft.directorParagraphs?.[index]?.trim() || paragraph);
}

function draftFromDynamic(journal: Journal, dynamicData: DynamicBinderData): BinderDraft {
  const details = findDynamicValue(journal, dynamicData.detailsByKey);
  const focus = findDynamicValue(journal, dynamicData.focusByKey);
  const editorialBoard = findDynamicValue(journal, dynamicData.editorialByKey) || [];
  const management = findDynamicValue(journal, dynamicData.managementByKey);
  const directorDesk = defaultDirectorDesk(journal);
  const contacts = defaultPage5Contacts(isLawJournal(journal));

  return {
    journalTitle: details?.name || journal.name,
    journalAbbreviation: details?.abbreviation || journal.abbreviation || journal.shortName,
    eIssn: details?.eIssn || journal.eIssn || "2582-2888",
    sjif: journal.impactFactor || "6.017",
    icv: journal.icv.replace(/^ICV\s*:\s*/i, "") || "62.07",
    coverImage: defaultCoverImage(journal),
    backCoverImage: journal.coverBack ? proxiedImage(journal.coverBack) : defaultBackCoverImage(),
    journalLogoImage: proxiedImage(journal.publisherLogo || journal.journalLogo),
    footerRightLogoImage: proxiedImage(journal.indexingLogo),
    frontCoverLayout: defaultFrontCoverLayout,
    frontCoverLayoutCustomized: false,
    pageLayouts: defaultBinderPageLayouts,
    journalWebsite: defaultCoverWebsite(journal),
    issueVolume: defaultIssueVolume,
    issueNumber: defaultIssueNumber,
    issueMonthRange: defaultIssueMonthRange,
    issueYear: defaultIssueYear,
    about: focus?.about || details?.about || journal.about || "",
    focusScope: focusKeywords(focus, focusList),
    focusNotes: defaultFocusNotes,
    editorialBoard,
    managementHead: management?.head ?? {
      name: "Puneet Mehrotra",
      role: "Chairman and Director",
      department: "",
      photo: logoAssets.director.src,
    },
    managementMembers: management?.members?.length
      ? management.members
      : isLawJournal(journal) ? lawManagementMembers : managementMembers,
    ...contacts,
    directorTitle: directorDesk.title,
    directorName: directorDesk.name,
    directorRole: directorDesk.role,
    directorParagraphs: directorDesk.paragraphs,
    manuscriptNotice: defaultManuscriptNotice,
    contentRows: contents,
    coverPrinter: "",
    publisherAddress: "",
    publisherPhone: "",
    publisherEmail: "",
    publisherWebsite: "",
    registeredOffice: "",
    cin: "",
    paymentOverride: "",
  };
}

function hasGenericManagementMembers(draft: BinderDraft) {
  return draft.managementMembers.length > 8 ||
    draft.managementMembers.some((member) =>
      ["STM Conferences", "Nursing", "Computer Science & Engineering", "Medical & Pharmacy"].includes(member.department),
    );
}

function hasDefaultFocusScope(draft: BinderDraft) {
  const current = dynamicKey(draft.focusScope.join(" "));
  return !current ||
    current === dynamicKey(focusList.join(" ")) ||
    current === dynamicKey(focusList.slice(0, 5).join(" "));
}

function normalizeDraftForJournal(journal: Journal, draft: BinderDraft, dynamicData?: DynamicBinderData) {
  const directorDesk = defaultDirectorDesk(journal);
  const hydratedDraft = {
    ...draft,
    sjif: draft.sjif ?? journal.impactFactor ?? "",
    icv: draft.icv ?? journal.icv.replace(/^ICV\s*:\s*/i, "") ?? "",
    coverImage: draft.coverImage && draft.coverImage !== journal.logo ? draft.coverImage : defaultCoverImage(journal),
    backCoverImage: draft.backCoverImage || (journal.coverBack ? proxiedImage(journal.coverBack) : defaultBackCoverImage()),
    journalLogoImage: draft.journalLogoImage || proxiedImage(journal.publisherLogo || journal.journalLogo),
    footerRightLogoImage: draft.footerRightLogoImage || proxiedImage(journal.indexingLogo),
    frontCoverLayout: draft.frontCoverLayoutCustomized
      ? normalizeFrontCoverLayout(draft.frontCoverLayout)
      : defaultFrontCoverLayout,
    frontCoverLayoutCustomized: Boolean(draft.frontCoverLayoutCustomized),
    pageLayouts: normalizeBinderPageLayouts(draft.pageLayouts),
    journalAbbreviation: draft.journalAbbreviation || journal.abbreviation || journal.shortName,
    journalWebsite: normalizeCoverWebsite(draft.journalWebsite, journal),
    directorTitle: draft.directorTitle?.trim() || directorDesk.title,
    directorName: draft.directorName?.trim() || directorDesk.name,
    directorRole: draft.directorRole?.trim() || directorDesk.role,
    directorParagraphs: hasDirectorContent(draft.directorParagraphs) ? draft.directorParagraphs : directorDesk.paragraphs,
  };
  const focus = dynamicData ? findDynamicValue(journal, dynamicData.focusByKey) : undefined;
  const withFocus = focus && hasDefaultFocusScope(draft)
    ? {
        ...hydratedDraft,
        about: focus.about || hydratedDraft.about,
        focusScope: focusKeywords(focus, hydratedDraft.focusScope),
      }
    : hydratedDraft;
  const withFocusNotes = withFocus.focusNotes?.length ? withFocus : { ...withFocus, focusNotes: defaultFocusNotes };

  if (!isLawJournal(journal) || !hasGenericManagementMembers(withFocusNotes)) return withFocusNotes;

  return {
    ...withFocusNotes,
    managementMembers: lawManagementMembers,
    directorTitle: withFocusNotes.directorTitle === "From the Director's Desk" ? directorDesk.title : withFocusNotes.directorTitle,
    directorRole: withFocusNotes.directorRole === "Managing Director" ? directorDesk.role : withFocusNotes.directorRole,
    directorParagraphs: hasDirectorContent(withFocusNotes.directorParagraphs) ? withFocusNotes.directorParagraphs : directorDesk.paragraphs,
  };
}

function initialDrafts(
  journals: Journal[],
  dynamicData: DynamicBinderData,
  serverDrafts: Record<string, StoredDraft>,
) {
  return Object.fromEntries(
    journals.map((journal) => [
      journal.id,
      normalizeDraftForJournal(
        journal,
        serverDrafts[journal.id]?.draft || draftFromDynamic(journal, dynamicData),
        dynamicData,
      ),
    ]),
  );
}

function draftJournal(journal: Journal, draft: BinderDraft): Journal {
  return {
    ...journal,
    name: draft.journalTitle || journal.name,
    abbreviation: draft.journalAbbreviation || journal.abbreviation,
    website: draft.journalWebsite || journal.website,
    eIssn: draft.eIssn || journal.eIssn,
    impactFactor: draft.sjif || journal.impactFactor,
    icv: draft.icv || journal.icv,
    logo: draft.journalLogoImage || journal.journalLogo || journal.logo,
    journalLogo: journal.journalLogo,
    about: draft.about || journal.about,
  };
}

function editorialText(members: EditorialMember[]) {
  return members
    .map((member) =>
      [member.role, member.name, member.designation, member.affiliation, member.location].filter(Boolean).join(" | "),
    )
    .join("\n");
}

function parseEditorialText(value: string): EditorialMember[] {
  return value
    .split("\n")
    .map((line, index) => {
      const [role = "Editor", name = "", designation = "", affiliation = "", location = ""] = line
        .split("|")
        .map((part) => part.trim());

      return {
        role,
        name,
        designation,
        department: "",
        affiliation,
        location,
        email: "",
        photo: "",
        priority: index + 1,
      };
    })
    .filter((member) => member.name);
}

// No editorial-board data exists in the CSV sources, so new drafts are seeded with this
// editable sample board. Surfacing it into the draft keeps the page-7 editor and the
// rendered/exported page in sync (previously the editor was empty while the page injected
// these names invisibly). Users replace these rows per journal.
function sampleEditorialBoard(): EditorialMember[] {
  return boardMembers.map(([name, designation, affiliation, role], index) => ({
    role: role || "Editor",
    name,
    designation,
    department: "",
    affiliation,
    location: "",
    email: "",
    photo: "",
    priority: index + 1,
  }));
}

function pageEditorTitle(page: number) {
  const titles = [
    "Cover spread journal metadata",
    "Publisher title page metadata",
    "Subscription and legal information",
    "Journal details and focus/scope",
    "Publication management team",
    "Manuscript engine submission structure",
    "Editorial board structure",
    "Director desk letter content",
    "Table of contents metadata",
  ];

  return titles[page - 1] || "Page controls";
}


function exportBaseSlug(journal: Journal | undefined, draft: BinderDraft | null) {
  const base = journal?.abbreviation || journal?.shortName || draft?.journalTitle || "journal";
  const volume = draft?.issueVolume || defaultIssueVolume;
  const issue = draft?.issueNumber || defaultIssueNumber;
  return `${base}-volume-${volume}-issue-${issue}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "journal";
}

function pdfFileName(journal: Journal | undefined, draft: BinderDraft | null, mode: ExportMode) {
  return `${exportBaseSlug(journal, draft)}-${mode === "cover" ? "cover" : "internal-pages"}.pdf`;
}

type ExportJob = { mode: ExportMode; filename: string };
type ExportError = { mode: ExportMode; message: string } | null;
type BookEntry = { journal: Journal; draft: BinderDraft };
type BookSnapshot = BookEntry[] | null;


function DownloadButton({
  label,
  mode,
  busy,
  disabled,
  error,
  onExport,
}: {
  label: string;
  mode: ExportMode;
  busy: boolean;
  disabled: boolean;
  error: string;
  onExport: (mode: ExportMode) => void;
}) {
  return (
    <div className="download-button">
      <button className="primary-action" disabled={disabled || busy} onClick={() => onExport(mode)}>
        <Download size={16} />
        {busy ? "Preparing PDF..." : label}
      </button>
      {error ? (
        <span className="download-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function LogoThumb({ src, label }: { src: string; label: string }) {
  if (!src || !src.trim()) return null;
  return (
    <div className="logo-thumb" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${label} preview`} />
    </div>
  );
}

function JournalLogo({ journal }: { journal: Journal }) {
  return (
    <div className="journal-logo">
      {journal.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={journal.logo} alt={`${journal.name} logo`} crossOrigin="anonymous" />
      ) : (
        <span>{initials(journal.abbreviation || journal.name)}</span>
      )}
    </div>
  );
}

function PageNumber({ value }: { value: number }) {
  return (
    <span className="page-number">{lowerRoman(value)}</span>
  );
}

function PdfHeader({
  journal,
  label,
  showLogo = true,
  showLabel = true,
}: {
  journal: Journal;
  label: string;
  showLogo?: boolean;
  showLabel?: boolean;
}) {
  return (
    <header className="pdf-header">
      {showLogo ? <JournalLogo journal={journal} /> : <div aria-hidden="true" />}
      <div>
        <p>{journal.publisher || "MBA Journals"}</p>
        <h2>{titleCaseName(journal.name)}</h2>
      </div>
      {showLabel ? <span>{label}</span> : <div aria-hidden="true" />}
    </header>
  );
}

function ContentHeader({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  return (
    <header className="content-header">
      <div>
        <h2>{titleCaseName(journal.name)}</h2>
        <p>Volume {draft.issueVolume || defaultIssueVolume} | Issue {draft.issueNumber || defaultIssueNumber} | {(draft.issueMonthRange || defaultIssueMonthRange).replace("-", "–")}</p>
      </div>
    </header>
  );
}

// Per-brand fallback strings, chosen by matching the journal's publisher/imprint
// name. Used only when the linked DB Company/Publisher leaves a field blank.
function brandDefaults(journal: Journal) {
  const publisher = journal.publisher || "MBA Journals";
  const imprint = journal.imprint || "MBA Journals, An imprint of Consortium e-Learning Network Pvt. Ltd.";
  const haystack = `${publisher} ${imprint}`.toLowerCase();

  if (haystack.includes("journalspub") || haystack.includes("dhruv")) {
    return {
      publisherName: "JournalsPub",
      companyName: "Dhruv Info Systems Private Limited",
      address: "Sales Office: A-118, 2nd Floor, Sector-63, Noida, Uttar Pradesh, PIN 201301, India",
      email: "info@journalspub.com",
      phone: "0120-4781200; Mobile No.: +91 9810078958",
      website: "www.journalspub.com",
      logoMode: "journalspub",
    };
  }

  if (haystack.includes("stm journals")) {
    return {
      publisherName: "STM Journals",
      companyName: "Consortium e-Learning Network Pvt. Ltd.",
      address: "A-118, 1st Floor, Sector-63, Noida, U.P. India, Pin - 201301",
      email: "info@stmjournals.com",
      phone: "(+91)-0120-4781-200",
      website: "www.stmjournals.com",
      logoMode: "stm",
    };
  }

  if (haystack.includes("law journals")) {
    return {
      publisherName: "Law Journals",
      companyName: "Consortium e-Learning Network Pvt. Ltd.",
      address: "A-118, 1st Floor, Sector-63, Noida, U.P. India, Pin - 201301",
      email: "info@stmjournals.com",
      phone: "+91 120-4781211",
      website: "www.lawjournals.stmjournals.com",
      logoMode: "law",
    };
  }

  return {
    publisherName: "MBA Journals",
    companyName: "Consortium e-Learning Network Pvt. Ltd.",
    address: "A-118, 1st Floor, Sector-63, Noida, U.P. India, Pin - 201301",
    email: "info@mbajournals.in",
    phone: "91(0)120-4781200/218/219",
    website: "www.mbajournals.in",
    logoMode: "mba",
  };
}

// Publisher identity for the binder pages. Values are pulled from the journal's
// linked Publisher + Company (DB) and only fall back to the per-brand defaults
// when a DB field is blank — so editing the Company in Setup updates every page.
function publisherIdentity(journal: Journal) {
  const base = brandDefaults(journal);
  const registeredAddress = journal.address?.trim() || base.address;
  const salesAddress = journal.salesAddress?.trim() || base.address;
  return {
    ...base,
    publisherName: journal.publisher?.trim() || base.publisherName,
    companyName: journal.imprint?.trim() || base.companyName,
    email: journal.publisherEmail?.trim() || base.email,
    phone: journal.publisherPhone?.trim() || base.phone,
    website: journal.companyWebsite?.trim() || base.website,
    // Primary display address prefers the sales/office address.
    address: salesAddress,
    registeredAddress,
    salesAddress,
  };
}

function PublisherLogo({ mode, side }: { mode: string; side: "publisher" | "company" }) {
  if (side === "company") {
    if (mode === "journalspub") {
      return (
        <ImageLogo asset={logoAssets.dhruv} className="dhruv-logo" />
      );
    }

    return (
      <ImageLogo asset={logoAssets.consortium} className="consortium-logo" />
    );
  }

  if (mode === "journalspub") {
    return (
      <ImageLogo asset={logoAssets.journalspub} className="journalspub-logo" />
    );
  }

  if (mode === "stm") {
    return (
      <ImageLogo asset={logoAssets.stm} className="stm-logo" />
    );
  }

  if (mode === "law") {
    return (
      <ImageLogo asset={logoAssets.law} className="law-logo" />
    );
  }

  return (
    <ImageLogo asset={logoAssets.mba} className="mba-logo" />
  );
}

function ImageLogo({
  asset,
  className,
}: {
  asset: { src: string; alt: string; width: number; height: number };
  className: string;
}) {
  return (
    <div className={`publisher-logo image-logo ${className}`}>
      <Image
        src={asset.src}
        alt={asset.alt}
        width={asset.width}
        height={asset.height}
        unoptimized
      />
    </div>
  );
}

function CoverBitmap({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (!src) {
    return (
      <div className={`${className} image-placeholder`}>
        <span>{alt}</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} crossOrigin="anonymous" />;
}



function excellenceLogoSource(draft: BinderDraft, journal: Journal) {
  const logo = draft.footerRightLogoImage?.trim();
  const cover = draft.coverImage || defaultCoverImage(journal);
  if (!logo || logo === cover || logo === defaultCoverImage(journal)) return "";
  return logo;
}

function coverHasEmbeddedFooterLogos(src: string) {
  return ["/brand/joadms-pdf-front.png", "/brand/joadms-cover.webp"].includes(src.trim());
}

function FrontCoverPublisherMark({ draft }: { draft: BinderDraft }) {
  const publisherLogo = draft.journalLogoImage?.trim();

  if (publisherLogo) {
    return <CoverBitmap src={publisherLogo} alt="Publisher logo" className="front-cover-publisher-logo" />;
  }

  return <span className="front-cover-footer-spacer" aria-hidden="true" />;
}

function FrontCoverExcellenceMark({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const excellenceLogo = excellenceLogoSource(draft, journal);

  if (excellenceLogo) {
    return <CoverBitmap src={excellenceLogo} alt={`${journal.name} logo`} className="front-cover-journal-logo" />;
  }

  return null;
}

function DigitalLibraryBackCover({ draft }: { draft: BinderDraft }) {
  return (
    <article className="digital-library-cover">
      <CoverBitmap src={draft.backCoverImage || defaultBackCoverImage()} alt="Digital Library back cover" className="cover-panel-image" />
    </article>
  );
}

function JournalFrontCover({
  journal,
  draft,
  interactive = false,
  onLayoutChange,
}: {
  journal: Journal;
  draft: BinderDraft;
  interactive?: boolean;
  onLayoutChange?: (layout: BinderDraft["frontCoverLayout"]) => void;
}) {
  const volume = draft.issueVolume || defaultIssueVolume;
  const issue = draft.issueNumber || defaultIssueNumber;
  const monthRange = draft.issueMonthRange || defaultIssueMonthRange;
  const year = draft.issueYear || defaultIssueYear;
  const abbreviation = draft.journalAbbreviation || journal.abbreviation || journal.shortName || "JOADMS";
  const website = normalizeCoverWebsite(draft.journalWebsite, journal);
  const coverImage = draft.coverImage || defaultCoverImage(journal);
  const shouldMaskEmbeddedFooter = coverHasEmbeddedFooterLogos(coverImage);
  const coverTitle = draft.journalTitle || journal.name;

  return (
    <article className="journal-front-cover">
      <CoverBitmap src={coverImage} alt={journal.name} className="cover-panel-image" />
      <FrontCoverCanvas
        abbreviation={abbreviation}
        sjif={draft.sjif || journal.impactFactor || ""}
        icv={cleanIcv(draft.icv || journal.icv)}
        eIssn={draft.eIssn || journal.eIssn || ""}
        issueLine={`Volume ${volume}  No. ${issue}  ${year}`}
        website={website.replace(/^https?:\/\//i, "")}
        title={coverTitle}
        titleClassName={frontCoverTitleClass(coverTitle)}
        monthRange={monthRange.replace("-", "–")}
        layout={draft.frontCoverLayout}
        interactive={interactive}
        showEmbeddedFooterMask={shouldMaskEmbeddedFooter}
        publisherMark={<FrontCoverPublisherMark draft={draft} />}
        excellenceMark={<FrontCoverExcellenceMark journal={journal} draft={draft} />}
        onLayoutChange={onLayoutChange}
      />
    </article>
  );
}

function CoverSpreadPage({
  journal,
  draft,
  interactive = false,
  onLayoutChange,
}: {
  journal: Journal;
  draft: BinderDraft;
  interactive?: boolean;
  onLayoutChange?: (layout: BinderDraft["frontCoverLayout"]) => void;
}) {
  return (
    <section className="pdf-page cover-spread-page" data-export-group="cover" data-page-title="Digital library back and journal front cover">
      <DigitalLibraryBackCover draft={draft} />
      <JournalFrontCover journal={journal} draft={draft} interactive={interactive} onLayoutChange={onLayoutChange} />
    </section>
  );
}

function CoverPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const identity = publisherIdentity(journal);
  const legal = useContext(LegalContext)[journal.id];
  const volume = draft.issueVolume || defaultIssueVolume;
  const issue = draft.issueNumber || defaultIssueNumber;
  const monthRange = draft.issueMonthRange || defaultIssueMonthRange;
  const year = draft.issueYear || defaultIssueYear;

  // Precedence: per-issue draft override → journal's Company (DB) → static default.
  const publisherName = legal?.publisherName || identity.publisherName;
  const companyName = legal?.companyName || identity.companyName;
  const address = draft.publisherAddress || legal?.salesAddress || legal?.registeredAddress || identity.address;
  const phone = draft.publisherPhone || legal?.phone || identity.phone;
  const email = draft.publisherEmail || legal?.email || identity.email;
  const website = draft.publisherWebsite || legal?.website || identity.website;
  const registeredOffice = draft.registeredOffice || legal?.registeredAddress || defaultRegisteredOffice;
  const cin = draft.cin || legal?.cin || defaultCin;
  const gst = legal?.gst;

  return (
    <section className="pdf-page cover-page" data-export-group="internal" data-page-title="Journal Name with volume issue page">
      <div className="page-rule" />
      <p className="cover-issn">ISSN: {journal.eIssn || "2582-2888"}</p>
      <p className="cover-printer">Printed by : {draft.coverPrinter || defaultCoverPrinter}</p>
      <h1>{titleCaseName(journal.name)}</h1>
      <p className="issue-line">Volume {volume} | Issue {issue}</p>
      <p className="cover-meta">{monthRange} | {year}</p>
      <div className="cover-footer">
        <div className="publisher-logo-row">
          <PublisherLogo mode={identity.logoMode} side="publisher" />
          <PublisherLogo mode={identity.logoMode} side="company" />
        </div>
        <b>{publisherName}</b>
        <strong>{companyName}</strong>
        <span>{address}</span>
        <span>Tel. No.: {phone}</span>
        <span>E-mail: {email}; Website: {website}</span>
        <span>Regd. Office: {registeredOffice}</span>
        <span>CIN No.: {cin}{gst ? `; GST: ${gst}` : ""}</span>
      </div>
      <PageNumber value={1} />
    </section>
  );
}

// Plain-text seed for the page-3 override editor: a solid starting point the
// user can edit. Mirrors the general (non-publisher-specific) generated content.
function generatePaymentText(journal: Journal, draft: BinderDraft): string {
  const identity = publisherIdentity(journal);
  const year = draft.issueYear || defaultIssueYear;
  const email = draft.publisherEmail || identity.email;
  const phone = draft.publisherPhone || identity.phone;
  return [
    `${identity.publisherName} (an imprint of ${identity.companyName}) is the Publisher of the Journal. Statements and opinions expressed in the Journal reflect the views of the author(s) and are not the opinion of ${identity.publisherName} unless so stated.`,
    "",
    `SUBSCRIPTION INFORMATION AND ORDER (JANUARY TO DECEMBER, ${year})`,
    "",
    "National Subscription",
    "Print: ₹3500 per Journal (Two Print Issues), Single Issue ₹1800.",
    "Online: ₹6500 per Journal (Online Access of Current and Back Issues).",
    "Print + Online: ₹7315 per Journal (Two Print and Online Access of Current and Back Issues).",
    "",
    "International Subscription",
    ...subscriptionPlans,
    "",
    `To purchase print compilation of back issues, please send your query at ${email}. Subscription must be prepaid. Rates outside of India include delivery. Prices subject to change without notice.`,
    "",
    "MODE OF PAYMENT — Pay Through NEFT/RTGS/Online Transfer",
    "Account Number: 03942000001153",
    `Account Name: ${identity.companyName}`,
    "Bank Name: HDFC, Sector-62, Noida, U.P., India",
    "IFSC Code: HDFC0002649, Swift Code: HDFCINBBXXX",
    "",
    "ONLINE ACCESS POLICY — For Authors",
    `${identity.publisherName} offers Optional Open Access publication at nominal cost:`,
    "India: ₹1500 includes single hard copy of Author's Journal.",
    "SAARC and African Countries: $100 includes single hard copy of Author's Journal.",
    "Other Countries: $200 includes single hard copy of Author's Journal.",
    "",
    "LEGAL DISPUTES",
    `All legal disputes are subject to Delhi Jurisdiction only. For any questions, please contact the Publication Management Team at ${email}; Tel: ${phone}.`,
  ].join("\n");
}

function PaymentPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const override = draft.paymentOverride?.trim();
  if (override) {
    return (
      <section className="pdf-page payment-reference-page" data-export-group="internal">
        <div className="payment-override">{draft.paymentOverride}</div>
        <PageNumber value={2} />
      </section>
    );
  }

  const identity = publisherIdentity(journal);
  const isJournalsPub = identity.logoMode === "journalspub";
  const isStm = identity.logoMode === "stm";
  const isLaw = identity.logoMode === "law";
  const paymentPublisherName = isJournalsPub ? "Journals Pub" : identity.publisherName;
  const legalPhone = isJournalsPub ? "+91 120-4781200" : isLaw ? "+91 120-4781211" : identity.phone;
  const subscriptionYear = draft.issueYear || defaultIssueYear;

  // Dynamic legal/subscription data from the DB (publisher → company + the
  // journal's subscription plans). Each field falls back to the previous static
  // default when the company/plan data hasn't been filled in.
  const legal = useContext(LegalContext)[journal.id];
  const companyName = legal?.companyName || "Consortium e-Learning Network Pvt. Ltd.";
  const payeeBankName = legal?.bankAccountName || companyName;
  const bankAccountNo = legal?.bankAccountNo || "03942000001153";
  const bankName = legal?.bankName || "HDFC";
  const bankBranch = legal?.bankBranch || "HDFC Bank, Sector-62, Noida, U.P., India";
  const bankIfsc = legal?.bankIfsc || "HDFC0002649";
  const bankSwift = legal?.bankSwift || "HDFCINBBXXX";
  const sendToAddress = legal?.registeredAddress || "A-118, Level 1, Sector-63, Noida, 201 301, U.P., India";
  const legalPhoneDisplay = legal?.phone || legalPhone;
  const modeLabel = (m: string) => (m === "PRINT" ? "Print" : m === "ONLINE" ? "Online" : "Print + Online");
  const inrPlans = (legal?.plans ?? []).filter((p) => p.priceInr != null);
  const usdPlans = (legal?.plans ?? []).filter((p) => p.priceUsd != null);

  return (
    <section className="pdf-page payment-reference-page" data-export-group="internal">
      <p>
        {isLaw
          ? "Law Journals (a division of Consortium e-Learning Network Private Ltd.) is the Publisher of Journal. Statements and opinions expressed in the Journal reflect the views of the author(s) and are not the opinion of Law Journals unless so stated."
          : isJournalsPub
          ? "Journals Pub (a division of Dhruv Infosystems Private Ltd.) having its Marketing office located at Office No. 4, First Floor, CSC Pocket E Market, Mayur Vihar Phase II, New Delhi 110091, India, is the Publisher of the Journals. Statements and opinions expressed in the Journal reflect the views of the Author(s) and are not the opinion of Journals Pub unless so stated."
          : isStm
          ? "STM Journals (an imprint of Consortium e-Learning Network Pvt. Ltd.) having its marketing office located at Office No. 4, First Floor, CSC Pocket E Market, Mayur Vihar Phase II, New Delhi 110091, India, is the Publisher of Journals. The author(s) or editor(s) expressed in the Journal reflect the views of the author(s) and are not the opinion of STM Journals unless so stated."
          : "MBA Journals (an imprint of Consortium e-Learning Network Pvt. Ltd.) having its marketing office located at Office No. 4, First Floor, CSC Pocket E Market, Mayur Vihar Phase II, New Delhi 110091, India, is the Publisher of Journals. The author(s) or editor(s) expressed in the Journal reflect the views of the author(s) and are not the opinion of MBA Journals unless so stated."}
      </p>

      <h1>SUBSCRIPTION INFORMATION AND ORDER (JANUARY TO DECEMBER, {subscriptionYear})</h1>
      <p><b>National Subscription</b> (₹, India)</p>
      {inrPlans.length ? (
        <ul className="checkbox-list">
          {inrPlans.map((p) => (
            <li key={`inr-${p.name}`}>{p.name} ({modeLabel(p.mode)}): ₹{p.priceInr} per Journal.</li>
          ))}
        </ul>
      ) : (
        <p>
          Print: ₹3500 per Journal (Two Print Issues), Single Issue ₹1800.<br />
          Online: ₹6500 per Journal (Online Access of Current and Back Issues).<br />
          Print + Online: ₹7315 per Journal (Two Print and Online Access of Current and Back Issues).
        </p>
      )}
      <p><b>International Subscription</b> ($, outside India)</p>
      {usdPlans.length ? (
        <ul className="checkbox-list">
          {usdPlans.map((p) => (
            <li key={`usd-${p.name}`}>{p.name} ({modeLabel(p.mode)}): ${p.priceUsd} per Journal.</li>
          ))}
        </ul>
      ) : (
        <ul className="checkbox-list">
          {subscriptionPlans.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      <p>
        To purchase print compilation of back issues, please send your query at {identity.email}. Subscription must be
        prepaid. Rates outside of India include delivery. Prices subject to change without notice.
      </p>

      <h2>MODE OF PAYMENT</h2>
      <p><b>Pay Through NEFT/RTGS/Online Transfer</b></p>
      <p>
        Account Number: {bankAccountNo}<br />
        Account Name: {payeeBankName}<br />
        Bank Name: {bankName}<br />
        Bank Branch: {bankBranch}<br />
        IFSC Code: {bankIfsc}, Swift Code: {bankSwift}
      </p>
      <p>
        <b>Pay Through Cheque/Demand Draft</b><br />
        At Par Cheque, Demand Draft, and RTGS (payment to be made in favor of {companyName}, payable at Delhi/New Delhi).
      </p>
      <p>
        <b>Please Send Demand Draft/Cheque to following address:</b><br />
        Subscription Department, {paymentPublisherName},<br />
        {companyName}<br />
        {sendToAddress}<br />
        Tel.: {legalPhoneDisplay}
      </p>
      {legal?.cin || legal?.gst ? (
        <p>
          {legal?.cin ? <>CIN: {legal.cin}<br /></> : null}
          {legal?.gst ? <>GST: {legal.gst}</> : null}
        </p>
      ) : null}

      <h2>ONLINE ACCESS POLICY</h2>
      {isJournalsPub || isLaw ? (
        <>
          <p>
            <b>For Authors</b><br />
            In order to provide maximum citation and wide publicity to the authors work, {isLaw ? "Law Journals" : "Journals Pub"} also have Open
            Access Policy, authors who would like to get their work open access can opt for Optional Open Access
            publication at nominal cost as follows.
          </p>
          <p>
            India: ₹1500 includes single hard copy of Author&apos;s Journal.<br />
            SAARC and African Countries: $100 includes single hard copy of Author&apos;s Journal.<br />
            Other Countries: $200 includes single hard copy of Author&apos;s Journal.
          </p>
        </>
      ) : (
        <>
          <p>
            <b>For Authors</b><br />
            For grant of Open Access publication, maximum citation and wide publicity to the authors work, {identity.publisherName} also
            have Open Access Policy, authors who would like to get their work open access can opt for Optional Open Access
            publication at nominal charges.
          </p>
          <p>
            India: ₹1500 includes single hard copy of Author&apos;s Journal.<br />
            SAARC and African Countries: $100 includes single hard copy of Author&apos;s Journal.<br />
            Other Countries: $200 including single hard copy of Author&apos;s Journal.
          </p>
        </>
      )}
      <p>
        <b>For Subscribers</b>
      </p>
      {isJournalsPub || isLaw ? (
        <>
          <ul className="checkbox-list">
            <li>Online access will be activated within 72 hours of receipt of the payment (working days), subject to receipt of correct information on user details/Static IP address of the subscriber.</li>
            <li>The access will be blocked</li>
          </ul>
          <ul className="subpoint-list">
            <li>If the user requests for the same and furnishes valid reasons for blocking.</li>
            <li>Due to technical issue.</li>
            <li>Misuse of the access rights as per the access policy.</li>
          </ul>
        </>
      ) : (
        <ul className="checkbox-list">
          <li>Online access will be activated within 72 hours of receipt of the payment (working days), subject to receipt of correct information on user details/Static IP address of the subscriber.</li>
          <li>There will be blocking.</li>
          <li>If the user request for the same and furnishes valid reasons for blocking.</li>
          <li>Due to technical issue.</li>
          <li>Misuse of the access rights as per the access policy.</li>
        </ul>
      )}

      <h2>ADVERTISING AND COMMERCIAL REPRINT INQUIRIES</h2>
      {isJournalsPub || isLaw ? (
        <p>
          {isLaw ? "Law Journals" : "Journals Pub"} with wide circulation and visibility offer an excellent media for showcasing/promotion of your
          products/services and the events namely, Conferences, Symposia/Seminars, etc. These journals have very high
          potential to deliver the message across the targeted audience regularly with each published issue. The
          advertisements on bulk subscriptions, gift subscriptions or reprint purchases for distribution, etc. are also
          most welcome.
        </p>
      ) : (
        <p>
          {identity.publisherName} with wide circulation and visibility offer an excellent media for showcasing/promotion of your
          products, services and events namely, Conferences, Symposia/Seminars, etc. These Journals have very high potential
          to deliver the message across the targeted audience regularly with each published issue. The advertisements on bulk
          subscriptions, gift subscriptions or reprint purchases for distribution, etc. are also most welcome.
        </p>
      )}

      <h2>LOST ISSUE CLAIMS</h2>
      <p><i>Please note the following when applying for lost or missing issues:</i></p>
      <ul className="checkbox-list">
        <li>Claims for print copies lost will be honored only after 45 days of the dispatch date and before publication of the next issue as per the frequency.</li>
        <li>Tracking ID for the speed post will be provided to all our subscribers and the claims for the missing Journals will be entertained only with the proofs that will be verified at both the ends.</li>
        <li>Claims filed due to insufficient information (or no notice) of change of address will not be honored.</li>
        <li>Change of Address of Dispatch should be intimated to {paymentPublisherName} at least two months prior to the dispatch schedule as per the frequency by mentioning subscriber ID and the subscription ID.</li>
        <li>Refund requests will not be entertained.</li>
      </ul>

      <h2>{isJournalsPub || isLaw ? "LEGAL DISPUTES" : "LEGAL DISPUTE"}</h2>
      <p>
        All the legal disputes are subjected to Delhi Jurisdiction only. If you have any questions, please contact the
        Publication Management Team at {identity.email}; Tel: {legalPhone}.
      </p>
      <PageNumber value={2} />
    </section>
  );
}

function JournalDetailsPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const identity = publisherIdentity(journal);
  const isLaw = identity.logoMode === "law";
  const scopeItems = focusScopeItemsForPage(draft);
  const focusNotes = draft.focusNotes?.length ? draft.focusNotes : defaultFocusNotes;
  const aboutText = draft.about || journal.about;
  // Top "about" paragraph is sourced from the publisher's about text when set,
  // otherwise the built-in imprint blurb below is used.
  const publisherAbout = journal.publisherAbout?.trim();
  const pageScale = pageDensityScale(
    [publisherAbout ?? "", aboutText, ...scopeItems, ...focusNotes].join(" ").length,
    2350,
  );

  return (
    <section className="pdf-page journal-info-page" data-export-group="internal" style={pageStyle(pageScale)}>
      <div className="journal-info-head">
        <PublisherLogo mode={identity.logoMode} side="publisher" />
        <h1>{titleCaseName(journal.name)}</h1>
      </div>
      {publisherAbout ? (
        <p>
          <b>{identity.publisherName}</b> {publisherAbout}
          {aboutText ? ` ${aboutText}` : ""}
        </p>
      ) : isLaw ? (
        <p>
          <b>Law Journals</b>, an imprint of Consortium E-learning Network Private Ltd. is prepared under the support
          and guidance by our esteemed editorial board members from renowned institutions.{" "}
          {aboutText || "The journal supports legal research, review articles, case studies, and current thought in the legal domain."}
        </p>
      ) : (
        <p>
          <b>{identity.publisherName}</b> is a bouquet of research publications which disseminates knowledge dealing with
          domains such as Applied Sciences, Medicine, Engineering, Management and Technology.{" "}
          {aboutText || "We encourage research and thinking, and attempt to contribute to a better perception of academic and professional knowledge across research communities."}
        </p>
      )}
      <section>
        <h2>Objectives</h2>
        <ul>
          {(isLaw ? lawObjectives : objectives).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <section>
        <h2>Salient Features</h2>
        <ul>
          {(isLaw ? lawSalientFeatures : salientFeatures).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <p className="journal-focus-intro">
        <b>{journal.name.toUpperCase()}</b>, is focused towards the rapid publication in the following areas.
      </p>
      <section>
        <h2>Focus and Scope</h2>
        <ul className="focus-list">
          {scopeItems.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      </section>
      <div>
        {focusNotes.map((note, index) => <p key={index}>{note}</p>)}
      </div>
      <PageNumber value={3} />
    </section>
  );
}

function TeamPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const identity = publisherIdentity(journal);
  const isLaw = identity.logoMode === "law";
  const fallbackContacts = defaultPage5Contacts(isLaw);
  const contacts = {
    dispatchContactName: draft.dispatchContactName?.trim() || fallbackContacts.dispatchContactName,
    dispatchContactPhone: draft.dispatchContactPhone?.trim() || fallbackContacts.dispatchContactPhone,
    dispatchContactEmail: draft.dispatchContactEmail?.trim() || fallbackContacts.dispatchContactEmail,
    salesContactName: draft.salesContactName?.trim() || fallbackContacts.salesContactName,
    salesContactPhone: draft.salesContactPhone?.trim() || fallbackContacts.salesContactPhone,
    salesContactEmail: draft.salesContactEmail?.trim() || fallbackContacts.salesContactEmail,
  };
  const pageScale = pageDensityScale(
    [
      identity.website,
      identity.phone,
      identity.email,
      ...(isLaw ? lawJournalNames : []),
    ].join(" ").length,
    1500,
  );

  return (
    <section className="pdf-page management-page" data-export-group="internal" style={pageStyle(pageScale)}>
      <div className="page-rule" />
      <h1>Publication and Management Team</h1>
      <ManagementProfile person={draft.managementHead} featured />
      <div className="management-band">Members</div>
      <div className="management-photo-grid">
        {draft.managementMembers.map((member, index) => (
          <ManagementProfile key={index} person={member} />
        ))}
      </div>
      {isLaw ? (
        <section className="law-journal-roster">
          <h2>Law Journals</h2>
          <div>
            {lawJournalNames.map((name) => <span key={name}>{name}</span>)}
          </div>
        </section>
      ) : null}
      <div className="management-contact-boxes">
        <div>
          <b>For any query related to Dispatch and Online Access, please contact</b>
          <span>{contacts.dispatchContactName}</span>
          <span>Tel.: {contacts.dispatchContactPhone}</span>
          <span>E-mail: {contacts.dispatchContactEmail}</span>
          <strong>Website: {identity.website}</strong>
        </div>
        <div>
          <b>For any query related to Sales and Marketing, please contact</b>
          <span>{contacts.salesContactName}</span>
          <span>Tel.: {contacts.salesContactPhone}</span>
          <span>E-mail: {contacts.salesContactEmail}</span>
          <strong>Tel. no.: {identity.phone}</strong>
        </div>
      </div>
      <PageNumber value={4} />
    </section>
  );
}

function ManagementProfile({ person, featured = false }: { person: ManagementPerson; featured?: boolean }) {
  return (
    <article className={featured ? "management-profile featured" : "management-profile"}>
      {person.photo ? (
        <Image src={person.photo} alt={person.name} width={90} height={90} unoptimized />
      ) : (
        <span className="management-initials">{initials(person.name || "Member")}</span>
      )}
      <b>{person.name || "Team Member"}</b>
      <span>{person.role}</span>
      {person.department ? <small>({person.department})</small> : null}
    </article>
  );
}

function ManuscriptEnginePage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const url = journal.website || "https://journals.stmjournals.com/open-access/nolegein-journal-of-leadership-and-strategic-management/";
  const pageScale = pageDensityScale(`${url} ${draft.manuscriptNotice}`.length, 340);
  return (
    <section className="pdf-page details-page manuscript-page" data-export-group="internal" style={pageStyle(pageScale)}>
      <PdfHeader journal={journal} label="Manuscript Engine" showLogo={false} showLabel={false} />
      <h1>Manuscript Engine</h1>
      <p className="lead-text">
        Authors can submit manuscripts, track review progress, view decisions, and communicate with the editorial office through the journal manuscript engine.
      </p>
      <div className="engine-panel">
        <div>
          <QrCode size={34} />
          <Image
            className="qr-image"
            src={logoAssets.manuscriptQr.src}
            alt={logoAssets.manuscriptQr.alt}
            width={logoAssets.manuscriptQr.width}
            height={logoAssets.manuscriptQr.height}
            unoptimized
          />
          <span>Scan to open manuscript page</span>
        </div>
        <ol>
          <li>Create or log in to the author account.</li>
          <li>Select the journal and manuscript article type.</li>
          <li>Upload manuscript, author declaration, and required files.</li>
          <li>Confirm submission and track the peer-review workflow.</li>
        </ol>
      </div>
      <p className="url-line">{url}</p>
      <p className="manuscript-notice">{draft.manuscriptNotice}</p>
      <PageNumber value={5} />
    </section>
  );
}

function EditorialPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const members = draft.editorialBoard;
  const chief = members.find((member) => {
    const role = member.role.toLowerCase();
    return role.includes("chief") && !role.includes("associate");
  });
  const associateChiefs = members.filter((member) => member.role.toLowerCase().includes("associate"));
  const editors = members.filter(
    (member) =>
      !member.role.toLowerCase().includes("chief") &&
      !member.role.toLowerCase().includes("associate"),
  );
  const chiefBlock = chief ? (
    <section>
      <h3>Editor-in-Chief</h3>
      <EditorialMemberLine member={chief} />
    </section>
  ) : null;
  const associateBlock = associateChiefs.length > 0 ? (
    <section>
      <h3>Associate Editor-in-Chief</h3>
      <div className="editor-grid">
        {associateChiefs.map((member) => <EditorialMemberLine key={`${member.role}-${member.name}`} member={member} />)}
      </div>
    </section>
  ) : null;
  const editorsBlock = editors.length > 0 ? (
    <section>
      <h3>Editors</h3>
      <div className="editor-grid">
        {editors.slice(0, 12).map((member) => <EditorialMemberLine key={`${member.role}-${member.name}`} member={member} />)}
      </div>
    </section>
  ) : null;
  const pageScale = pageDensityScale(
    members
      .map((member) => [member.name, member.designation, member.affiliation, member.location].filter(Boolean).join(" "))
      .join(" ")
      .length,
    3600,
  );

  return (
    <section className="pdf-page editorial-page" data-export-group="internal" style={pageStyle(pageScale)}>
      <div className="page-rule" />
      <h1>{titleCaseName(journal.name)}</h1>
      <h2>Editorial Board Members</h2>
      {members.length === 0 ? <p className="editorial-empty">No editorial board members have been added for this journal yet.</p> : null}
      {members.length > 0 ? chiefBlock : null}
      {members.length > 0 ? associateBlock : null}
      {members.length > 0 ? editorsBlock : null}
      <PageNumber value={6} />
    </section>
  );
}

function DirectorPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const paragraphs = directorParagraphsForJournal(journal, draft).filter((paragraph) => paragraph.trim());
  const pageScale = pageDensityScale(paragraphs.join(" ").length, 3600);

  return (
    <section className="pdf-page director-page" data-export-group="internal" style={pageStyle(pageScale)}>
      <div className="page-rule" />
      <h1>{draft.directorTitle}</h1>
      <div className="director-letter">
        <div className="director-intro">
          <Image
            className="portrait"
            src={draft.directorPhotoImage || logoAssets.director.src}
            alt={logoAssets.director.alt}
            width={logoAssets.director.width}
            height={logoAssets.director.height}
            unoptimized
          />
          <div className="director-intro-copy">
            <p className="dear-line"><b>Dear Readers,</b></p>
            <p className="director-first-paragraph">{paragraphs[0].replaceAll("{journal}", titleCaseName(journal.name))}</p>
          </div>
        </div>
        {paragraphs.slice(1).map((paragraph, index) => (
          <p key={index}>{paragraph.replaceAll("{journal}", titleCaseName(journal.name))}</p>
        ))}
      </div>
      <div className="signature">
        <Image
          src={draft.directorSignatureImage || logoAssets.signature.src}
          alt={logoAssets.signature.alt}
          width={logoAssets.signature.width}
          height={logoAssets.signature.height}
          unoptimized
        />
        <span>{draft.directorName}</span>
        <b>{draft.directorRole}</b>
      </div>
      <PageNumber value={7} />
    </section>
  );
}

function ContentPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const rows = draft.contentRows.length ? draft.contentRows : contents;
  const pageScale = pageDensityScale(
    rows.map((row) => `${row.title} ${row.author} ${row.page}`).join(" ").length,
    1600,
  );

  return (
    <section className="pdf-page content-page" data-export-group="internal" style={pageStyle(pageScale)}>
      <ContentHeader journal={journal} draft={draft} />
      <h1>Contents</h1>
      <table className="contents-table">
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.title}-${index}`}>
              <td><b>{row.title}</b><span>{row.author}</span></td>
              <td>{row.page}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PageNumber value={8} />
    </section>
  );
}

function EditorialMemberLine({ member }: { member: EditorialMember }) {
  return (
    <div className="member-line">
      <b>{member.name}</b>
      <span>{member.designation || member.department}</span>
      <small>{[member.affiliation, member.location].filter(Boolean).join(", ")}</small>
    </div>
  );
}

function BinderPage({
  page,
  journal,
  draft,
  interactiveCover = false,
  onFrontCoverLayoutChange,
}: {
  page: number;
  journal: Journal;
  draft: BinderDraft;
  interactiveCover?: boolean;
  onFrontCoverLayoutChange?: (layout: BinderDraft["frontCoverLayout"]) => void;
}) {
  const currentJournal = draftJournal(journal, draft);

  switch (page) {
    case 1:
      return (
        <CoverSpreadPage
          journal={currentJournal}
          draft={draft}
          interactive={interactiveCover}
          onLayoutChange={onFrontCoverLayoutChange}
        />
      );
    case 2:
      return <CoverPage journal={currentJournal} draft={draft} />;
    case 3:
      return <PaymentPage journal={currentJournal} draft={draft} />;
    case 4:
      return <JournalDetailsPage journal={currentJournal} draft={draft} />;
    case 5:
      return <TeamPage journal={currentJournal} draft={draft} />;
    case 6:
      return <ManuscriptEnginePage journal={currentJournal} draft={draft} />;
    case 7:
      return <EditorialPage journal={currentJournal} draft={draft} />;
    case 8:
      return <DirectorPage journal={currentJournal} draft={draft} />;
    case 9:
      return <ContentPage journal={currentJournal} draft={draft} />;
    default:
      return <CoverSpreadPage journal={currentJournal} draft={draft} />;
  }
}

function PageSet({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  return (
    <div className="page-set">
      {Array.from({ length: totalPages }, (_, index) => (
        <BinderPage key={index + 1} page={index + 1} journal={journal} draft={draft} />
      ))}
    </div>
  );
}

function SectionEditor({
  journal,
  draft,
  dynamicData,
  activePage,
  saveStatus,
  onChange,
  onSave,
  exportingMode,
  exportError,
  onExport,
  onResetFrontCoverLayout,
  profiles,
}: {
  journal: Journal;
  draft: BinderDraft;
  dynamicData: DynamicBinderData;
  activePage: number;
  saveStatus: string;
  onChange: (draft: BinderDraft) => void;
  onSave: () => void;
  exportingMode: ExportMode | null;
  exportError: ExportError;
  onExport: (mode: ExportMode) => void;
  onResetFrontCoverLayout: () => void;
  profiles: ProfilePick[];
}) {
  const legalForJournal = useContext(LegalContext)[journal.id];
  const apiKeys = journalLookupKeys(journal);
  const hasDetails = apiKeys.some((key) => dynamicData.detailsByKey[key]);
  const hasFocus = apiKeys.some((key) => dynamicData.focusByKey[key]);
  const hasEditorial = apiKeys.some((key) => dynamicData.editorialByKey[key]);
  const focusNotes = draft.focusNotes?.length ? draft.focusNotes : defaultFocusNotes;
  const directorParagraphs = directorParagraphsForJournal(journal, draft);
  const [uploadError, setUploadError] = useState("");

  function updateEditorial(index: number, patch: Partial<EditorialMember>) {
    onChange({
      ...draft,
      editorialBoard: draft.editorialBoard.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...patch } : member,
      ),
    });
  }

  function addEditorial() {
    onChange({
      ...draft,
      editorialBoard: [
        ...draft.editorialBoard,
        {
          role: "Editor",
          name: "",
          designation: "",
          department: "",
          affiliation: "",
          location: "",
          email: "",
          photo: "",
          priority: draft.editorialBoard.length + 1,
        },
      ],
    });
  }

  function removeEditorial(index: number) {
    onChange({ ...draft, editorialBoard: draft.editorialBoard.filter((_, memberIndex) => memberIndex !== index) });
  }

  function useSampleEditorialBoard() {
    onChange({ ...draft, editorialBoard: sampleEditorialBoard() });
  }

  function updateParagraph(index: number, value: string) {
    onChange({
      ...draft,
      directorParagraphs: directorParagraphs.map((paragraph, paragraphIndex) =>
        paragraphIndex === index ? value : paragraph,
      ),
    });
  }

  function updateFocusNote(index: number, value: string) {
    onChange({
      ...draft,
      focusNotes: focusNotes.map((note, noteIndex) => (noteIndex === index ? value : note)),
    });
  }

  function updateManagementHead(patch: Partial<ManagementPerson>) {
    onChange({ ...draft, managementHead: { ...draft.managementHead, ...patch } });
  }

  function updateManagementMember(index: number, patch: Partial<ManagementPerson>) {
    onChange({
      ...draft,
      managementMembers: draft.managementMembers.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...patch } : member,
      ),
    });
  }

  function addManagementMember() {
    onChange({
      ...draft,
      managementMembers: [
        ...draft.managementMembers,
        { name: "New Member", role: "Associate Editor", department: "", photo: "" },
      ],
    });
  }

  function useLawManagementTeam() {
    onChange({ ...draft, managementMembers: lawManagementMembers });
  }

  function removeManagementMember(index: number) {
    onChange({
      ...draft,
      managementMembers: draft.managementMembers.filter((_, memberIndex) => memberIndex !== index),
    });
  }

  // Upload an image to the server (stored in the DB) and hand back its serve URL
  // (/api/assets/{id}) — replaces the old base64 data-URL approach.
  async function readPhoto(file: File | undefined, callback: (photo: string) => void) {
    if (!file) return;
    const maxBytes = 8 * 1024 * 1024;
    if (!file.type.startsWith("image/")) {
      setUploadError(`"${file.name}" is not an image file. Choose a PNG, JPG, or WEBP.`);
      return;
    }
    if (file.size > maxBytes) {
      setUploadError(`"${file.name}" is ${(file.size / 1048576).toFixed(1)} MB — please use an image under 8 MB.`);
      return;
    }
    try {
      setUploadError("");
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/assets", { method: "POST", body: form });
      if (response.status === 403) {
        setUploadError("Read-only access — uploads are disabled.");
        return;
      }
      if (!response.ok) {
        setUploadError(`Could not upload "${file.name}". Please try again.`);
        return;
      }
      const data = (await response.json()) as { url: string };
      callback(data.url);
    } catch {
      setUploadError(`Could not upload "${file.name}". Please try again.`);
    }
  }

  function useDynamicPageOneData() {
    const dynamicDraft = normalizeDraftForJournal(journal, draftFromDynamic(journal, dynamicData), dynamicData);

    onChange({
      ...draft,
      journalTitle: dynamicDraft.journalTitle,
      journalAbbreviation: dynamicDraft.journalAbbreviation,
      eIssn: dynamicDraft.eIssn,
      sjif: dynamicDraft.sjif,
      icv: cleanIcv(dynamicDraft.icv),
      coverImage: dynamicDraft.coverImage,
      backCoverImage: dynamicDraft.backCoverImage,
      journalLogoImage: dynamicDraft.journalLogoImage,
      footerRightLogoImage: dynamicDraft.footerRightLogoImage,
      journalWebsite: dynamicDraft.journalWebsite,
    });
  }

  function updateContentRow(index: number, patch: Partial<ContentRow>) {
    onChange({
      ...draft,
      contentRows: draft.contentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    });
  }

  function addContentRow() {
    onChange({
      ...draft,
      contentRows: [...draft.contentRows, { title: "New article title", author: "Author name", page: "" }],
    });
  }

  function removeContentRow(index: number) {
    onChange({ ...draft, contentRows: draft.contentRows.filter((_, rowIndex) => rowIndex !== index) });
  }

  return (
    <section className="section-editor">
      <div className="section-editor-head">
        <span className="editor-kicker">Page {activePage} form controls</span>
        <b>{pageEditorTitle(activePage)}</b>
        <span>Using local CSV and static defaults</span>
      </div>
      <div className="api-source-grid">
        <span className={hasDetails ? "loaded" : ""}>Journal details CSV</span>
        <span className={hasFocus ? "loaded" : ""}>Focus & scope CSV</span>
        <span className={hasEditorial ? "loaded" : ""}>Static editorial board</span>
      </div>
      {dynamicData.status.errors.length > 0 ? (
        <div className="api-errors">
          {dynamicData.status.errors.map((error) => <p key={error}>{error}</p>)}
        </div>
      ) : null}
      <div className="editor-save-row">
        <button type="button" onClick={onSave}>Save Page {activePage} Details</button>
        {saveStatus ? <span>{saveStatus}</span> : null}
      </div>
      {uploadError ? <div className="upload-error" role="alert">{uploadError}</div> : null}
      {activePage === 1 ? (
        <>
          <div className="editor-row-head">
            <span>First page dynamic data</span>
            <div className="editor-row-actions">
              <button type="button" onClick={useDynamicPageOneData}>Reload CSV Data</button>
              <button type="button" onClick={onResetFrontCoverLayout}>Reset Drag Layout</button>
            </div>
          </div>
          <div className="editor-note">
            Drag each text line and logo slot directly on the live canvas. The guides now react to nearby edges, centers, margins, and neighboring items so subelements can be placed much more precisely.
          </div>
          <label>
            <span>Journal title</span>
            <input
              value={draft.journalTitle}
              onChange={(event) => onChange({ ...draft, journalTitle: event.target.value })}
            />
          </label>
          <div className="two-field-grid">
            <label>
              <span>Cover abbreviation</span>
              <input
                value={draft.journalAbbreviation || ""}
                onChange={(event) => onChange({ ...draft, journalAbbreviation: event.target.value })}
              />
            </label>
            <label>
              <span>Website</span>
              <input
                value={draft.journalWebsite || ""}
                onChange={(event) => onChange({ ...draft, journalWebsite: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>e-ISSN</span>
            <input
              value={draft.eIssn}
              onChange={(event) => onChange({ ...draft, eIssn: event.target.value })}
            />
          </label>
          <div className="two-field-grid">
            <label>
              <span>SJIF</span>
              <input
                value={draft.sjif}
                onChange={(event) => onChange({ ...draft, sjif: event.target.value })}
              />
            </label>
            <label>
              <span>ICV</span>
              <input
                value={cleanIcv(draft.icv)}
                onChange={(event) => onChange({ ...draft, icv: event.target.value })}
              />
            </label>
          </div>
          <div className="cover-meta-editor">
            <label>
              <span>Volume</span>
              <input
                value={draft.issueVolume}
                onChange={(event) => onChange({ ...draft, issueVolume: event.target.value })}
              />
            </label>
            <label>
              <span>Issue</span>
              <input
                value={draft.issueNumber}
                onChange={(event) => onChange({ ...draft, issueNumber: event.target.value })}
              />
            </label>
            <label>
              <span>Month range</span>
              <input
                value={draft.issueMonthRange}
                onChange={(event) => onChange({ ...draft, issueMonthRange: event.target.value })}
              />
            </label>
            <label>
              <span>Year</span>
              <input
                value={draft.issueYear}
                onChange={(event) => onChange({ ...draft, issueYear: event.target.value })}
              />
            </label>
          </div>
          <label className="file-field">
            <span>Upload front cover image</span>
            <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (coverImage) => onChange({ ...draft, coverImage }))} />
          </label>
          <label>
            <span>Static front cover image URL</span>
            <input
              value={draft.coverImage}
              onChange={(event) => onChange({ ...draft, coverImage: event.target.value })}
            />
          </label>
          <LogoThumb src={draft.coverImage} label="Front cover" />
          <label className="file-field">
            <span>Upload back cover image</span>
            <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (backCoverImage) => onChange({ ...draft, backCoverImage }))} />
          </label>
          <label>
            <span>Static back cover image URL</span>
            <input
              value={draft.backCoverImage || ""}
              onChange={(event) => onChange({ ...draft, backCoverImage: event.target.value })}
            />
          </label>
          <LogoThumb src={draft.backCoverImage} label="Back cover" />
          <div className="two-field-grid logo-input-grid">
            <div className="logo-input-section">
              <strong>Bottom-left cover logo (publisher mark)</strong>
              <label className="file-field">
                <span>Upload bottom-left logo</span>
                <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (journalLogoImage) => onChange({ ...draft, journalLogoImage }))} />
              </label>
              <label>
                <span>Or bottom-left logo URL</span>
                <input
                  value={draft.journalLogoImage}
                  onChange={(event) => onChange({ ...draft, journalLogoImage: event.target.value })}
                />
              </label>
              <LogoThumb src={draft.journalLogoImage} label="Bottom-left logo" />
            </div>
            <div className="logo-input-section">
              <strong>Bottom-right cover logo (excellence / award)</strong>
              <label className="file-field">
                <span>Upload bottom-right logo</span>
                <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (footerRightLogoImage) => onChange({ ...draft, footerRightLogoImage }))} />
              </label>
              <label>
                <span>Or bottom-right logo URL</span>
                <input
                  value={draft.footerRightLogoImage || ""}
                  onChange={(event) => onChange({ ...draft, footerRightLogoImage: event.target.value })}
                />
              </label>
              <LogoThumb src={draft.footerRightLogoImage} label="Bottom-right logo" />
            </div>
          </div>
          <div className="editor-note">
            Both bottom cover-footer logo slots are blank by default. Add a logo here only when you want it shown in the cover footer (left = publisher mark, right = excellence/award badge).
          </div>
          <div className="final-export-actions">
            <DownloadButton
              mode="cover"
              label="Download Cover PDF"
              busy={exportingMode === "cover"}
              disabled={exportingMode !== null}
              error={exportError?.mode === "cover" ? exportError.message : ""}
              onExport={onExport}
            />
          </div>
        </>
      ) : null}
      {activePage === 2 ? (
        <>
          <div className="editor-note">
            The title-page blocks on page 2 can now be dragged on the canvas, including the ISSN line, title, issue/meta, printer strip, and footer publisher block.
          </div>
          <div className="editor-note">
            The title page logos and publisher name come from the selected journal. Override any line below — leave blank to use the generated default (shown as placeholder).
          </div>
          <label>
            <span>Printed by</span>
            <input value={draft.coverPrinter || ""} placeholder={defaultCoverPrinter} onChange={(event) => onChange({ ...draft, coverPrinter: event.target.value })} />
          </label>
          <label>
            <span>Publisher address</span>
            <textarea rows={2} value={draft.publisherAddress || ""} placeholder={publisherIdentity(journal).address} onChange={(event) => onChange({ ...draft, publisherAddress: event.target.value })} />
          </label>
          <div className="two-field-grid">
            <label>
              <span>Publisher phone</span>
              <input value={draft.publisherPhone || ""} placeholder={publisherIdentity(journal).phone} onChange={(event) => onChange({ ...draft, publisherPhone: event.target.value })} />
            </label>
            <label>
              <span>Publisher email</span>
              <input value={draft.publisherEmail || ""} placeholder={publisherIdentity(journal).email} onChange={(event) => onChange({ ...draft, publisherEmail: event.target.value })} />
            </label>
          </div>
          <label>
            <span>Publisher website</span>
            <input value={draft.publisherWebsite || ""} placeholder={publisherIdentity(journal).website} onChange={(event) => onChange({ ...draft, publisherWebsite: event.target.value })} />
          </label>
          <label>
            <span>Registered office</span>
            <textarea rows={2} value={draft.registeredOffice || ""} placeholder={defaultRegisteredOffice} onChange={(event) => onChange({ ...draft, registeredOffice: event.target.value })} />
          </label>
          <label>
            <span>CIN No.</span>
            <input value={draft.cin || ""} placeholder={defaultCin} onChange={(event) => onChange({ ...draft, cin: event.target.value })} />
          </label>
        </>
      ) : null}
      {activePage === 3 ? (
        <>
          <Page3Editor journalId={journal.id} legal={legalForJournal} />
          <div className="editor-note">
            Page 3 now supports draggable section blocks. If you use the full text override, that override becomes one movable block; otherwise the generated legal/subscription sections can be positioned separately.
          </div>
          <div className="editor-note">
            This subscription &amp; legal page is auto-generated per publisher. To customise it, click &ldquo;Load Current Text&rdquo;, edit, and it will be used instead. Clear the box to return to the generated page.
          </div>
          <div className="editor-row-head">
            <span>Subscription &amp; legal page</span>
            <div className="editor-row-actions">
              <button type="button" onClick={() => onChange({ ...draft, paymentOverride: generatePaymentText(journal, draft) })}>Load Current Text</button>
              {draft.paymentOverride ? <button type="button" onClick={() => onChange({ ...draft, paymentOverride: "" })}>Reset to Generated</button> : null}
            </div>
          </div>
          <label>
            <span>Page text override</span>
            <textarea rows={16} value={draft.paymentOverride || ""} placeholder="Leave blank to use the auto-generated subscription & legal page." onChange={(event) => onChange({ ...draft, paymentOverride: event.target.value })} />
          </label>
        </>
      ) : null}
      {activePage === 4 ? (
        <>
          <div className="editor-note">
            The main journal-details sections on page 4 can also be dragged directly on the canvas and will keep their saved positions for this journal.
          </div>
          <label>
            <span>About journal</span>
            <textarea
              rows={6}
              value={draft.about}
              onChange={(event) => onChange({ ...draft, about: event.target.value })}
            />
          </label>
          <label>
            <span>Focus and scope</span>
            <textarea
              rows={10}
              value={draft.focusScope.join("\n")}
              onChange={(event) =>
                onChange({
                  ...draft,
                  focusScope: normalizeFocusScopeInput(event.target.value),
                })
              }
            />
          </label>
          <SaveFocusToJournal journalId={journal.id} about={draft.about} focusScope={draft.focusScope} />
          <div className="editor-note">
            Per-issue edits autosave to this issue. <b>Save About &amp; Focus to journal</b> promotes them to the journal record (the default for all issues).
          </div>
          <div className="editor-row-head">
            <span>Additional focus and scope text</span>
          </div>
          {focusNotes.map((note, index) => (
            <label key={index}>
              <span>Note paragraph {index + 1}</span>
              <textarea rows={index === 3 ? 7 : 4} value={note} onChange={(event) => updateFocusNote(index, event.target.value)} />
            </label>
          ))}
        </>
      ) : null}
      {activePage === 5 ? (
        <div className="editor-repeater">
          <div className="editor-note">
            Update the team details here. Page 5 now uses a fixed layout in the PDF preview.
          </div>
          <div className="editor-note">
            Pick people via the dropdowns, or{" "}
            <a href={`/journals/${journal.id}/edit`} className="board-team-link">manage this journal&apos;s Board &amp; Team</a>{" "}
            (Profiles + roles, shared across all issues).
          </div>
          <div className="management-edit-head">
            <span>Management head (chairman)</span>
            {profiles.length > 0 ? (
              <select
                className="profile-fill"
                defaultValue=""
                onChange={(event) => {
                  const picked = profiles.find((p) => p.id === event.target.value);
                  if (picked) {
                    updateManagementHead({
                      name: picked.name,
                      role: picked.role || draft.managementHead.role,
                      photo: picked.photo || draft.managementHead.photo,
                    });
                  }
                  event.target.value = "";
                }}
              >
                <option value="">Fill from a saved profile…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ""}</option>
                ))}
              </select>
            ) : null}
            <div className="management-edit-row">
              <input aria-label="Management head name" placeholder="Name" value={draft.managementHead.name} onChange={(event) => updateManagementHead({ name: event.target.value })} />
              <input aria-label="Management head role" placeholder="Role" value={draft.managementHead.role} onChange={(event) => updateManagementHead({ role: event.target.value })} />
              <label className="file-field">
                <span>Photo</span>
                <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (photo) => updateManagementHead({ photo }))} />
              </label>
            </div>
          </div>
          <div className="editor-row-head">
            <span>Publication Management Officers ({draft.managementMembers.length})</span>
            <div className="editor-row-actions">
              {isLawJournal(journal) ? <button type="button" onClick={useLawManagementTeam}>Use Law Team</button> : null}
              <button type="button" onClick={addManagementMember}>Add Member</button>
            </div>
          </div>
          {draft.managementMembers.map((member, index) => (
            <article className="management-edit-card" key={index}>
              <div className="management-edit-row">
                <input value={member.name} placeholder="Name" onChange={(event) => updateManagementMember(index, { name: event.target.value })} />
                <input value={member.role} placeholder="Role" onChange={(event) => updateManagementMember(index, { role: event.target.value })} />
                <input value={member.department} placeholder="Department specialty" onChange={(event) => updateManagementMember(index, { department: event.target.value })} />
                <label className="file-field compact">
                  <span>Photo</span>
                  <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (photo) => updateManagementMember(index, { photo }))} />
                </label>
                <button type="button" onClick={() => removeManagementMember(index)}>Delete</button>
              </div>
            </article>
          ))}
          {(() => {
            const c = defaultPage5Contacts(isLawJournal(journal));
            return (
              <div className="management-contact-edit">
                <div className="editor-row-head">
                  <span>Contact boxes</span>
                </div>
                <div className="management-edit-row">
                  <input aria-label="Dispatch contact name" placeholder="Dispatch contact name" value={draft.dispatchContactName ?? c.dispatchContactName} onChange={(event) => onChange({ ...draft, dispatchContactName: event.target.value })} />
                  <input aria-label="Dispatch contact phone" placeholder="Dispatch phone" value={draft.dispatchContactPhone ?? c.dispatchContactPhone} onChange={(event) => onChange({ ...draft, dispatchContactPhone: event.target.value })} />
                  <input aria-label="Dispatch contact email" placeholder="Dispatch e-mail" value={draft.dispatchContactEmail ?? c.dispatchContactEmail} onChange={(event) => onChange({ ...draft, dispatchContactEmail: event.target.value })} />
                </div>
                <div className="management-edit-row">
                  <input aria-label="Sales contact name" placeholder="Sales contact name" value={draft.salesContactName ?? c.salesContactName} onChange={(event) => onChange({ ...draft, salesContactName: event.target.value })} />
                  <input aria-label="Sales contact phone" placeholder="Sales phone" value={draft.salesContactPhone ?? c.salesContactPhone} onChange={(event) => onChange({ ...draft, salesContactPhone: event.target.value })} />
                  <input aria-label="Sales contact email" placeholder="Sales e-mail" value={draft.salesContactEmail ?? c.salesContactEmail} onChange={(event) => onChange({ ...draft, salesContactEmail: event.target.value })} />
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}
      {activePage === 6 ? (
        <>
          <div className="editor-note">
            Update the manuscript engine text here. Page 6 now uses a fixed layout in the PDF preview.
          </div>
          <label>
            <span>Manuscript submission notification</span>
            <textarea
              rows={9}
              value={draft.manuscriptNotice}
              onChange={(event) => onChange({ ...draft, manuscriptNotice: event.target.value })}
            />
          </label>
        </>
      ) : null}
      {activePage === 7 ? (
        <div className="editor-repeater">
          <div className="editor-note">
            Edit the editorial content here. Page 7 now uses a fixed layout in the PDF preview.
          </div>
          <div className="editor-note">
            Edit per-issue here, or{" "}
            <a href={`/journals/${journal.id}/edit`} className="board-team-link">manage this journal&apos;s Board &amp; Team</a>{" "}
            (Profiles + roles, shared across all issues).
          </div>
          <div className="editor-row-head">
            <span>Editorial Board Members ({draft.editorialBoard.length})</span>
            <div className="editor-row-actions">
              <button type="button" onClick={useSampleEditorialBoard}>Insert Sample Board</button>
              <button type="button" onClick={addEditorial}>Add Board Row</button>
            </div>
          </div>
          {draft.editorialBoard.map((member, index) => (
            <article className="editorial-edit-card" key={index}>
              <div className="editorial-edit-actions">
                <select aria-label="Board member role" value={member.role} onChange={(event) => updateEditorial(index, { role: event.target.value })}>
                  <option>Editor in Chief</option>
                  <option>Editor</option>
                  <option>Associate Editor-in-Chief</option>
                </select>
                <button type="button" onClick={() => removeEditorial(index)}>Delete Row</button>
              </div>
              <input value={member.name} placeholder="Name" onChange={(event) => updateEditorial(index, { name: event.target.value })} />
              <input value={member.designation} placeholder="Designation" onChange={(event) => updateEditorial(index, { designation: event.target.value })} />
              <input value={member.affiliation} placeholder="Affiliation" onChange={(event) => updateEditorial(index, { affiliation: event.target.value })} />
              <input value={member.location} placeholder="Location" onChange={(event) => updateEditorial(index, { location: event.target.value })} />
            </article>
          ))}
          {draft.editorialBoard.length === 0 ? (
            <textarea
              rows={8}
              value={editorialText(draft.editorialBoard)}
              placeholder="Role | Name | Designation | Affiliation | Location"
              onChange={(event) => onChange({ ...draft, editorialBoard: parseEditorialText(event.target.value) })}
            />
          ) : null}
        </div>
      ) : null}
      {activePage === 8 ? (
        <>
          <div className="editor-note">
            The Director&apos;s Desk keeps the default paragraph set by default. Edit any paragraph below to replace only that paragraph.
          </div>
          <label>
            <span>Director desk letter title</span>
            <input value={draft.directorTitle} onChange={(event) => onChange({ ...draft, directorTitle: event.target.value })} />
          </label>
          {profiles.length > 0 ? (
            <label>
              <span>Fill director from a saved profile</span>
              <select
                className="profile-fill"
                defaultValue=""
                onChange={(event) => {
                  const picked = profiles.find((p) => p.id === event.target.value);
                  if (picked) {
                    onChange({
                      ...draft,
                      directorName: picked.name,
                      directorRole: picked.role || draft.directorRole,
                      directorPhotoImage: picked.photo || draft.directorPhotoImage,
                    });
                  }
                  event.target.value = "";
                }}
              >
                <option value="">Fill from a saved profile…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ""}</option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="two-field-grid">
            <label>
              <span>Director name</span>
              <input value={draft.directorName} onChange={(event) => onChange({ ...draft, directorName: event.target.value })} />
            </label>
            <label>
              <span>Director role label</span>
              <input value={draft.directorRole} onChange={(event) => onChange({ ...draft, directorRole: event.target.value })} />
            </label>
          </div>
          <div className="two-field-grid">
            <label className="file-field">
              <span>Director photo {draft.directorPhotoImage ? "(custom)" : "(default)"}</span>
              <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (img) => onChange({ ...draft, directorPhotoImage: img }))} />
            </label>
            <label className="file-field">
              <span>Signature {draft.directorSignatureImage ? "(custom)" : "(default)"}</span>
              <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (img) => onChange({ ...draft, directorSignatureImage: img }))} />
            </label>
          </div>
          {draft.directorPhotoImage || draft.directorSignatureImage ? (
            <button type="button" onClick={() => onChange({ ...draft, directorPhotoImage: "", directorSignatureImage: "" })}>
              Reset photo &amp; signature to default
            </button>
          ) : null}
          <div className="editor-row-head">
            <span>Letter body paragraphs</span>
          </div>
          {directorParagraphs.map((paragraph, index) => (
            <article key={index} className="content-edit-card">
              <div className="editor-row-head">
                <span>Paragraph {index + 1}</span>
              </div>
              <textarea rows={4} value={paragraph} onChange={(event) => updateParagraph(index, event.target.value)} />
            </article>
          ))}
        </>
      ) : null}
      {activePage === 9 ? (
        <>
          <div className="editor-note">
            Update the contents rows here. Page 9 now uses a fixed layout in the PDF preview.
          </div>
          <div className="editor-note">
            If current issue or archive data is not available from API, fill these static rows manually. Saved rows are reused for this journal.
          </div>
          <div className="editor-repeater">
            <div className="editor-row-head">
              <span>Contents / Archive Article Rows ({draft.contentRows.length})</span>
              <button type="button" onClick={addContentRow}>Add Article</button>
            </div>
            {draft.contentRows.map((row, index) => (
              <article className="content-edit-card" key={index}>
                <label>
                  <span>Article title</span>
                  <input value={row.title} onChange={(event) => updateContentRow(index, { title: event.target.value })} />
                </label>
                <div className="content-edit-grid">
                  <label>
                    <span>Author(s)</span>
                    <input value={row.author} onChange={(event) => updateContentRow(index, { author: event.target.value })} />
                  </label>
                  <label>
                    <span>Page</span>
                    <input value={row.page} onChange={(event) => updateContentRow(index, { page: event.target.value })} />
                  </label>
                  <button type="button" onClick={() => removeContentRow(index)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
          <div className="final-export-actions">
            <button type="button" className="secondary-action" onClick={onSave}>Save All Details</button>
            <DownloadButton
              mode="internal"
              label="Download Internal Pages PDF"
              busy={exportingMode === "internal"}
              disabled={exportingMode !== null}
              error={exportError?.mode === "internal" ? exportError.message : ""}
              onExport={onExport}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

export default function JournalDashboard({ journals, defaultJournalId, dynamicData, serverDrafts, canEdit, profiles, legalData }: Props) {
  const [selectedId, setSelectedId] = useState(defaultJournalId);
  const [drafts, setDrafts] = useState<Record<string, BinderDraft>>(() => initialDrafts(journals, dynamicData, serverDrafts));
  const [updatedAtById, setUpdatedAtById] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(serverDrafts).map(([id, value]) => [id, value.updatedAt])),
  );
  // Which saved binder (issue) each journal's draft maps to; null = unsaved new issue.
  const [activeBinderId, setActiveBinderId] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(Object.entries(serverDrafts).map(([id, value]) => [id, value.binderId])),
  );
  const [bindersByJournal, setBindersByJournal] = useState<Record<string, BinderSummary[]>>({});
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [dashboardMode, setDashboardMode] = useState<"templates" | "preview">("templates");
  const [saveStatus, setSaveStatus] = useState("");
  const [journalQuery, setJournalQuery] = useState("");
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [exportError, setExportError] = useState<ExportError>(null);
  const [bookSnapshot, setBookSnapshot] = useState<BookSnapshot>(null);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const dirty = dirtyIds.size > 0;
  const primaryJournal = journals.find((journal) => journal.id === selectedId) || journals[0];
  const selectedJournals = primaryJournal ? [primaryJournal] : [];
  const primaryDraft = primaryJournal ? drafts[primaryJournal.id] || draftFromDynamic(primaryJournal, dynamicData) : null;
  const filteredJournals = useMemo(() => {
    const query = journalQuery.trim().toLowerCase();
    const matches = query
      ? journals.filter((journal) =>
          [
            journal.name,
            journal.abbreviation,
            journal.shortName,
            journal.publisher,
            journal.imprint,
            journal.domain,
            journal.eIssn,
            journal.pIssn,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : journals;
    const withSelected = primaryJournal && !matches.some((journal) => journal.id === primaryJournal.id)
      ? [primaryJournal, ...matches]
      : matches;

    return withSelected.slice(0, 600);
  }, [journalQuery, journals, primaryJournal]);

  function selectJournal(id: string) {
    const journal = journals.find((item) => item.id === id);
    setSelectedId(id);
    setActivePage(1);
    setDashboardMode("templates");
    setJournalQuery("");
    if (journal) {
      setDrafts((current) => ({
        ...current,
        [id]: normalizeDraftForJournal(journal, current[id] || draftFromDynamic(journal, dynamicData), dynamicData),
      }));
    }
    void loadBinders(id);
  }

  function markDirty(journalId: string) {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(journalId);
      return next;
    });
  }

  function clearDirty(journalId: string) {
    setDirtyIds((prev) => {
      if (!prev.has(journalId)) return prev;
      const next = new Set(prev);
      next.delete(journalId);
      return next;
    });
  }

  function updateDraft(journalId: string, draft: BinderDraft) {
    setDrafts((current) => ({ ...current, [journalId]: draft }));
    if (canEdit) markDirty(journalId);
  }

  // Persist one journal's draft to the server. Returns true on success; sets a
  // status message and (on 409) a conflict banner otherwise.
  async function persistDraft(journalId: string): Promise<boolean> {
    const draft = drafts[journalId];
    if (!draft) return false;
    try {
      const response = await fetch(`/api/journals/${journalId}/binder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          baseUpdatedAt: updatedAtById[journalId],
          binderId: activeBinderId[journalId] ?? undefined,
        }),
      });
      if (response.status === 403) {
        setSaveStatus("Read-only access — changes are not saved.");
        return false;
      }
      if (response.status === 409) {
        const data = (await response.json()) as ConflictState;
        setConflict({ ...data, journalId });
        setSaveStatus(`Edited by ${data.updatedByName ?? "someone else"} since you opened this.`);
        return false;
      }
      if (response.status === 422) {
        const data = (await response.json()) as { message?: string };
        setSaveStatus(data.message ?? "Could not save this issue.");
        return false;
      }
      if (!response.ok) {
        setSaveStatus("Save failed — please try again.");
        return false;
      }
      const data = (await response.json()) as { binderId: string; updatedAt: string };
      setUpdatedAtById((prev) => ({ ...prev, [journalId]: data.updatedAt }));
      setActiveBinderId((prev) => ({ ...prev, [journalId]: data.binderId }));
      clearDirty(journalId);
      void loadBinders(journalId);
      return true;
    } catch {
      setSaveStatus("Save failed — you appear to be offline.");
      return false;
    }
  }

  async function saveCurrentDraft() {
    if (!primaryJournal || !canEdit) return;
    const ok = await persistDraft(primaryJournal.id);
    if (ok) {
      setSaveStatus(`Saved details for ${primaryJournal.abbreviation || primaryJournal.name}`);
      window.setTimeout(() => setSaveStatus(""), 2500);
    } else {
      window.setTimeout(() => setSaveStatus(""), 6000);
    }
  }

  // Resolve a save conflict: either take the server's version or overwrite with
  // the local version on the next save (adopting the server timestamp as base).
  function resolveConflict(takeServer: boolean) {
    if (!conflict) return;
    const { journalId, draft: serverDraft, updatedAt } = conflict;
    if (takeServer) {
      const journal = journals.find((item) => item.id === journalId);
      const normalized = journal
        ? normalizeDraftForJournal(journal, serverDraft, dynamicData)
        : serverDraft;
      setDrafts((current) => ({ ...current, [journalId]: normalized }));
      clearDirty(journalId);
      setSaveStatus("Loaded the latest version.");
    } else {
      markDirty(journalId);
      setSaveStatus("Your version will overwrite on the next save.");
    }
    setUpdatedAtById((prev) => ({ ...prev, [journalId]: updatedAt }));
    setConflict(null);
    window.setTimeout(() => setSaveStatus(""), 3000);
  }

  // --- Issue (binder) picker -------------------------------------------------

  async function loadBinders(journalId: string): Promise<BinderSummary[]> {
    try {
      const res = await fetch(`/api/journals/${journalId}/binder`);
      if (!res.ok) return [];
      const data = (await res.json()) as { binders: BinderSummary[] };
      setBindersByJournal((prev) => ({ ...prev, [journalId]: data.binders }));
      return data.binders;
    } catch {
      return [];
    }
  }

  // Load an existing saved issue into the editor.
  async function selectBinder(journalId: string, binderId: string) {
    try {
      const res = await fetch(`/api/binders/${binderId}`);
      if (!res.ok) {
        setSaveStatus("Could not load that issue.");
        return;
      }
      const data = (await res.json()) as StoredDraft;
      const journal = journals.find((item) => item.id === journalId);
      const normalized = journal ? normalizeDraftForJournal(journal, data.draft, dynamicData) : data.draft;
      setDrafts((prev) => ({ ...prev, [journalId]: normalized }));
      setActiveBinderId((prev) => ({ ...prev, [journalId]: data.binderId }));
      setUpdatedAtById((prev) => ({ ...prev, [journalId]: data.updatedAt }));
      clearDirty(journalId);
      setConflict(null);
      setActivePage(1);
    } catch {
      setSaveStatus("Could not load that issue.");
    }
  }

  // Start a fresh, unsaved issue from the journal defaults.
  function newIssue(journalId: string) {
    const journal = journals.find((item) => item.id === journalId);
    if (!journal) return;
    const existing = bindersByJournal[journalId] ?? [];
    const maxIssue = existing.reduce((m, b) => Math.max(m, Number.parseInt(b.issue ?? "", 10) || 0), 0);
    const fresh = normalizeDraftForJournal(journal, draftFromDynamic(journal, dynamicData), dynamicData);
    const next = maxIssue ? { ...fresh, issueNumber: String(maxIssue + 1) } : fresh;
    setDrafts((prev) => ({ ...prev, [journalId]: next }));
    setActiveBinderId((prev) => ({ ...prev, [journalId]: null }));
    setUpdatedAtById((prev) => {
      const copy = { ...prev };
      delete copy[journalId];
      return copy;
    });
    clearDirty(journalId);
    setConflict(null);
    setActivePage(1);
    setSaveStatus("New issue — edit and save to create it.");
    window.setTimeout(() => setSaveStatus(""), 2500);
  }

  async function deleteActiveBinder(journalId: string) {
    const binderId = activeBinderId[journalId];
    if (!binderId || !canEdit) return;
    if (!window.confirm("Delete this issue permanently?")) return;
    try {
      const res = await fetch(`/api/binders/${binderId}`, { method: "DELETE" });
      if (!res.ok) {
        setSaveStatus(res.status === 403 ? "Read-only access." : "Could not delete the issue.");
        return;
      }
      const remaining = await loadBinders(journalId);
      if (remaining.length) await selectBinder(journalId, remaining[0].id);
      else newIssue(journalId);
      setSaveStatus("Issue deleted.");
      window.setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("Could not delete the issue.");
    }
  }

  // Load the issue list for the initially-selected journal.
  useEffect(() => {
    void loadBinders(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // U4 — debounced autosave: persist all dirty drafts ~1.5s after the last edit.
  useEffect(() => {
    if (!canEdit || dirtyIds.size === 0) return;
    const timer = window.setTimeout(async () => {
      let allOk = true;
      for (const id of Array.from(dirtyIds)) {
        const ok = await persistDraft(id);
        allOk = allOk && ok;
      }
      if (allOk) {
        setSaveStatus("Auto-saved");
        window.setTimeout(() => setSaveStatus(""), 1500);
      }
    }, 1500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirtyIds, drafts, canEdit]);

  // W3 — download all drafts as a JSON backup file.
  function exportDraftsJson() {
    const data = { ...drafts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "journal-cover-drafts.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  // W3 — import a drafts JSON backup, keeping only entries that match known journals.
  function importDraftsJson(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}")) as Record<string, BinderDraft>;
        if (!parsed || typeof parsed !== "object") throw new Error("invalid");
        const additions: Record<string, BinderDraft> = {};
        for (const [id, draft] of Object.entries(parsed)) {
          const journal = journals.find((item) => item.id === id);
          if (journal && draft && typeof draft === "object") {
            additions[id] = normalizeDraftForJournal(journal, draft as BinderDraft, dynamicData);
          }
        }
        const count = Object.keys(additions).length;
        if (count === 0) {
          setImportStatus("No matching journals found in that file.");
        } else {
          setDrafts((current) => ({ ...current, ...additions }));
          if (canEdit) {
            setDirtyIds((prev) => {
              const next = new Set(prev);
              for (const id of Object.keys(additions)) next.add(id);
              return next;
            });
          }
          setImportStatus(
            canEdit
              ? `Imported ${count} draft${count === 1 ? "" : "s"} — saving…`
              : `Imported ${count} draft${count === 1 ? "" : "s"} (read-only, not saved).`,
          );
        }
      } catch {
        setImportStatus("Could not import — the file is not valid drafts JSON.");
      }
      window.setTimeout(() => setImportStatus(""), 5000);
    };
    reader.onerror = () => {
      setImportStatus("Could not read the file.");
      window.setTimeout(() => setImportStatus(""), 5000);
    };
    reader.readAsText(file);
  }

  // PDF export: snapshot the active journal/draft, mount #pdf-book for html2canvas,
  // rasterize, then unmount so the 9-page export DOM stays out of the per-keystroke path.
  function runExport(mode: ExportMode) {
    if (exportJob || !primaryJournal || !primaryDraft) return;
    setExportError(null);
    setBookSnapshot([{ journal: primaryJournal, draft: primaryDraft }]);
    setExportJob({ mode, filename: pdfFileName(primaryJournal, primaryDraft, mode) });
  }

  // W2 — combine the selected journals into one PDF (covers or internal pages).
  function runBatchExport(mode: ExportMode) {
    if (exportJob) return;
    const entries = batchIds
      .map((id) => {
        const journal = journals.find((item) => item.id === id);
        return journal ? { journal, draft: drafts[id] || draftFromDynamic(journal, dynamicData) } : null;
      })
      .filter((entry): entry is BookEntry => entry !== null);
    if (entries.length === 0) return;
    setExportError(null);
    setBookSnapshot(entries);
    setExportJob({ mode, filename: `journals-batch-${entries.length}-${mode === "cover" ? "covers" : "internal-pages"}.pdf` });
  }

  useEffect(() => {
    if (!exportJob) return;
    const job = exportJob;
    let cancelled = false;

    (async () => {
      try {
        // Let the freshly-mounted export DOM lay out and paint before capture.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (cancelled) return;
        await exportBookToPdf(job.mode, job.filename);
      } catch (cause) {
        console.error("PDF export failed", cause);
        if (!cancelled) {
          setExportError({
            mode: job.mode,
            message:
              "PDF export failed. A cover image may be blocking export (cross-origin), or the browser ran low on memory. Try re-uploading the image or using a smaller one.",
          });
        }
      } finally {
        if (!cancelled) {
          setExportJob(null);
          setBookSnapshot(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exportJob]);

  // Native browser print (Ctrl+P / File > Print) and the Print button both fire
  // `beforeprint`. flushSync mounts #pdf-book synchronously *before* the browser
  // snapshots the page, so the print shows the journal pages (the print stylesheet
  // hides the editor chrome). afterprint returns to the lean unmounted state.
  useEffect(() => {
    function onBeforePrint() {
      if (primaryJournal && primaryDraft) {
        flushSync(() => setBookSnapshot([{ journal: primaryJournal, draft: primaryDraft }]));
      }
    }
    function onAfterPrint() {
      if (!exportJob) setBookSnapshot(null);
    }
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [primaryJournal, primaryDraft, exportJob]);

  return (
    <LegalContext.Provider value={legalData}>
    <main className="app-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-menu">
          <button className={dashboardMode === "templates" ? "active" : ""} onClick={() => setDashboardMode("templates")}>
            <SlidersHorizontal size={16} /> Template Layouts
          </button>
          <button className={dashboardMode === "preview" ? "active" : ""} onClick={() => setDashboardMode("preview")}>
            <Eye size={16} /> Live Preview & Export
          </button>
        </div>
        <div className="active-journal-card">
          <span>Active Journal</span>
          <b>{primaryJournal ? titleCaseName(primaryJournal.name) : "No journal selected"}</b>
          <small>ISSN: {primaryDraft?.eIssn || primaryJournal?.eIssn || "Not set"}</small>
          <small className={!canEdit ? "save-state" : dirty ? "save-state is-dirty" : "save-state is-saved"}>
            {!canEdit ? "🔒 Read-only" : dirty ? "● Unsaved changes" : "✓ All changes saved"}
          </small>
          {conflict && conflict.journalId === primaryJournal?.id && (
            <div className="save-conflict" role="alert">
              <span>Edited by {conflict.updatedByName ?? "someone else"} since you opened this.</span>
              <div className="save-conflict-actions">
                <button type="button" onClick={() => resolveConflict(true)}>Load latest</button>
                <button type="button" onClick={() => resolveConflict(false)}>Keep mine</button>
              </div>
            </div>
          )}
          {primaryJournal && (
            <div className="issue-picker">
              <span>Issue</span>
              <div className="issue-picker-row">
                <select
                  value={activeBinderId[primaryJournal.id] ?? "__new__"}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "__new__") newIssue(primaryJournal.id);
                    else selectBinder(primaryJournal.id, value);
                  }}
                >
                  {(bindersByJournal[primaryJournal.id] ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {`Vol ${b.volume || "—"} · No ${b.issue || "—"} · ${b.year ?? "—"}${b.type === "SPECIAL" ? " · Special" : ""}`}
                    </option>
                  ))}
                  <option value="__new__">
                    {activeBinderId[primaryJournal.id] == null ? "✳ New issue (unsaved)" : "＋ New issue…"}
                  </option>
                </select>
                {canEdit && activeBinderId[primaryJournal.id] != null && (
                  <button type="button" className="secondary-action" onClick={() => deleteActiveBinder(primaryJournal.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="journal-select-label">
            <span>Select journal</span>
            <div className="journal-combobox">
              <input
                value={journalQuery}
                onChange={(event) => {
                  setJournalQuery(event.target.value);
                  setComboOpen(true);
                }}
                onFocus={() => setComboOpen(true)}
                onBlur={() => window.setTimeout(() => setComboOpen(false), 120)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setComboOpen(false);
                  if (event.key === "Enter" && comboOpen && filteredJournals[0]) {
                    selectJournal(filteredJournals[0].id);
                    setComboOpen(false);
                  }
                }}
                placeholder={primaryJournal ? titleCaseName(primaryJournal.name) : "Search journal by name or abbreviation"}
                aria-label="Search and select journal"
                role="combobox"
                aria-controls="journal-combo-list"
                aria-expanded={comboOpen}
              />
              {comboOpen ? (
                <ul className="combo-list" id="journal-combo-list" role="listbox">
                  {filteredJournals.slice(0, 50).map((journal) => (
                    <li
                      key={journal.id}
                      role="option"
                      aria-selected={journal.id === primaryJournal?.id}
                      className={journal.id === primaryJournal?.id ? "active" : ""}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectJournal(journal.id);
                        setComboOpen(false);
                      }}
                    >
                      {journal.name} <small>({journal.abbreviation})</small>
                    </li>
                  ))}
                  {filteredJournals.length === 0 ? <li className="empty">No matches</li> : null}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </aside>

      <section className="workspace-panel">
        <div className="workspace-toolbar">
          <button className="icon-step" onClick={() => setActivePage((page) => Math.max(1, page - 1))}>
            <ArrowLeft size={16} />
          </button>
          <span>Active editor target:</span>
          <div className="page-stepper">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button className={activePage === page ? "active" : ""} key={page} onClick={() => setActivePage(page)}>
                {pageStepperLabel(page)}
              </button>
            ))}
          </div>
          <button className="icon-step" onClick={() => setActivePage((page) => Math.min(totalPages, page + 1))}>
            <ArrowRight size={16} />
          </button>
        </div>

        {primaryJournal && primaryDraft ? (
          <div className={dashboardMode === "preview" ? "layout-workbench preview-only" : "layout-workbench"}>
            <section className="live-canvas-panel">
              <span className="live-badge">Realtime Live Canvas</span>
              <div className="active-page-preview">
                {dashboardMode === "preview" ? (
                  <PageSet journal={primaryJournal} draft={primaryDraft} />
                ) : (
                  <BinderPage
                    page={activePage}
                    journal={primaryJournal}
                    draft={primaryDraft}
                    interactiveCover={activePage === 1}
                    onFrontCoverLayoutChange={(frontCoverLayout) =>
                      startTransition(() => {
                        updateDraft(primaryJournal.id, {
                          ...primaryDraft,
                          frontCoverLayout,
                          frontCoverLayoutCustomized: true,
                        });
                      })
                    }
                  />
                )}
              </div>
            </section>
            {dashboardMode === "templates" ? (
              <SectionEditor
                journal={primaryJournal}
                draft={primaryDraft}
                dynamicData={dynamicData}
                activePage={activePage}
                saveStatus={saveStatus}
                onChange={(draft) => updateDraft(primaryJournal.id, draft)}
                onSave={saveCurrentDraft}
                exportingMode={exportJob?.mode ?? null}
                exportError={exportError}
                onExport={runExport}
                onResetFrontCoverLayout={() =>
                  updateDraft(primaryJournal.id, {
                    ...primaryDraft,
                    frontCoverLayout: defaultFrontCoverLayout,
                    frontCoverLayoutCustomized: false,
                  })
                }
                profiles={profiles}
              />
            ) : (
              <section className="export-panel">
                <h2>Live Preview & Export</h2>
                <p>Download the active journal as two separate PDFs: one cover spread and one internal-page file.</p>
                <div className="toolbar">
                  <button className="secondary-action" disabled={exportJob !== null} onClick={() => window.print()}>
                    <Printer size={16} /> Print
                  </button>
                  <DownloadButton
                    mode="cover"
                    label="Download Cover PDF"
                    busy={exportJob?.mode === "cover"}
                    disabled={exportJob !== null || selectedJournals.length === 0}
                    error={exportError?.mode === "cover" ? exportError.message : ""}
                    onExport={runExport}
                  />
                  <DownloadButton
                    mode="internal"
                    label="Download Internal Pages PDF"
                    busy={exportJob?.mode === "internal"}
                    disabled={exportJob !== null || selectedJournals.length === 0}
                    error={exportError?.mode === "internal" ? exportError.message : ""}
                    onExport={runExport}
                  />
                </div>

                <div className="batch-export">
                  <div className="editor-row-head">
                    <span>Batch export ({batchIds.length} selected)</span>
                    <div className="editor-row-actions">
                      <button type="button" onClick={() => setBatchIds(filteredJournals.slice(0, 50).map((journal) => journal.id))}>Select shown</button>
                      <button type="button" onClick={() => setBatchIds([])}>Clear</button>
                    </div>
                  </div>
                  <input
                    value={journalQuery}
                    onChange={(event) => setJournalQuery(event.target.value)}
                    placeholder="Filter journals to select…"
                  />
                  <div className="batch-list">
                    {filteredJournals.slice(0, 100).map((journal) => (
                      <label key={journal.id} className="batch-item">
                        <input
                          type="checkbox"
                          checked={batchIds.includes(journal.id)}
                          onChange={(event) =>
                            setBatchIds((current) =>
                              event.target.checked ? [...current, journal.id] : current.filter((id) => id !== journal.id),
                            )
                          }
                        />
                        <span>{journal.name} ({journal.abbreviation})</span>
                      </label>
                    ))}
                  </div>
                  <div className="toolbar">
                    <button className="secondary-action" disabled={exportJob !== null || batchIds.length === 0} onClick={() => runBatchExport("cover")}>
                      {exportJob?.mode === "cover" ? "Preparing…" : `Download ${batchIds.length} Covers`}
                    </button>
                    <button className="secondary-action" disabled={exportJob !== null || batchIds.length === 0} onClick={() => runBatchExport("internal")}>
                      {exportJob?.mode === "internal" ? "Preparing…" : `Download ${batchIds.length} Internal Sets`}
                    </button>
                  </div>
                  <p className="batch-note">Selected journals combine into one PDF. Large batches are memory-heavy — about 25 journals at a time is a safe limit.</p>
                </div>

                <div className="backup-row">
                  <button type="button" className="secondary-action" onClick={exportDraftsJson}>Export Drafts (JSON)</button>
                  <label className="file-field">
                    <span>Import Drafts (JSON)</span>
                    <input type="file" accept="application/json,.json" onChange={(event) => importDraftsJson(event.target.files?.[0])} />
                  </label>
                  {importStatus ? <span className="backup-status">{importStatus}</span> : null}
                </div>
              </section>
            )}
          </div>
        ) : null}

        {bookSnapshot ? (
          <div id="pdf-book" className="pdf-export-source" aria-hidden="true">
            {bookSnapshot.map((entry) => (
              <PageSet key={entry.journal.id} journal={entry.journal} draft={entry.draft} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
    </LegalContext.Provider>
  );
}
