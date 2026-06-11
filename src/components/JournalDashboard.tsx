"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  Printer,
  QrCode,
  SlidersHorizontal,
} from "lucide-react";
import { journalLookupKeys } from "@/lib/formidable";
import type { DynamicBinderData, EditorialMember } from "@/lib/formidable";
import type { Journal } from "@/lib/journals";

type Props = {
  journals: Journal[];
  defaultJournalId: string;
  dynamicData: DynamicBinderData;
};

type BinderDraft = {
  journalTitle: string;
  eIssn: string;
  issueVolume: string;
  issueNumber: string;
  issueMonthRange: string;
  issueYear: string;
  about: string;
  focusScope: string[];
  editorialBoard: EditorialMember[];
  managementHead: ManagementPerson;
  managementMembers: ManagementPerson[];
  directorTitle: string;
  directorName: string;
  directorRole: string;
  directorParagraphs: string[];
  manuscriptNotice: string;
  contentRows: ContentRow[];
};

type ManagementPerson = {
  name: string;
  role: string;
  department: string;
  photo: string;
};

type ContentRow = {
  title: string;
  author: string;
  page: string;
};

const draftStorageKey = "journal-cover-page-drafts";
const defaultIssueVolume = "9";
const defaultIssueNumber = "1";
const defaultIssueMonthRange = "January to June";
const defaultIssueYear = "2026";

const boardMembers = [
  ["Dr. Tapas Kumar Chatterjee", "Associate Professor-Marketing", "Institute of Management Technology Maharashtra, India", "Editor in Chief"],
  ["Dr. Ritu Sharma", "Assistant Professor", "GD Goenka University Haryana, India", "Editor"],
  ["Dr. Sonali S. Patnaik", "Assistant Professor", "International University Uttar Pradesh, India", "Editor"],
  ["Dr. Herlandi de Souza Andrade", "Professor", "Centro Estadual de Educacao Tecnologica Paula Souza, Brazil", "Editor"],
  ["Dr. ALOK RANJAN", "Board of Directors, Advisory", "Emerit College University Uttar Pradesh, India", "Editor"],
  ["Dr. P.Malyadri", "Principal", "Rayalaseema University Andhra Pradesh, India", "Editor"],
  ["Dr. Shikha Bhardwaj", "Associate Professor", "IILM Graduate School Of Management Uttar Pradesh, India", "Editor"],
  ["Dr. D. GNYANESWER", "Assistant Professor", "Badruka School of Management Hyderabad, India", "Editor"],
  ["Dr. Prof. Naresh Sachdev", "Director", "PCTE Group of Institutes Ludhiana Punjab, India", "Editor"],
  ["Dr. Sundari Dadabhai", "Associate Professor", "Karnavati University Gujarat, India", "Editor"],
  ["Dr. Smita Raj Jain", "Professor", "Sagar Institute of Research & Technology Madhya Pradesh, India", "Editor"],
  ["Dr. Archita Banerjee", "Associate Professor", "West Bengal, India", "Editor"],
  ["Dr. Nada Jabbour Al Maalouf", "Assistant Professor", "Holy Spirit University of Kaslik Lebanon", "Editor"],
];

const contents: ContentRow[] = [
  { title: "Indian Knowledge System and Management in India: An Integrative Perspective", author: "Bindya S. Soni", page: "1" },
  { title: "AI-Enabled Leadership Development and Strategic Organizational Analysis in Higher Education: Emerging HRM and Organizational Behavior Practices for 2026-2027", author: "Ameya Mohammed Ali", page: "7" },
  { title: "Impact of Toxic Leadership in the 21st Century on Employees' Intentions to Leave, with Workplace Bullying as a Mediating Factor", author: "Amaresh Satpathy, Pranad Ranjan Panda, Swapnamayee Sahoo", page: "16" },
  { title: "Standardizing Public Infrastructure Procurement: A Best Practice Trajectory for Nigerian Quantity Surveyors", author: "Alozie I. Ahmadi", page: "25" },
  { title: "Purpose-Driven Startups: A Holistic Leadership Framework for Building Resilient and Scalable Ventures", author: "Tuhin Mukharjee, Mayank Kumar Dwivedi", page: "35" },
];

const focusList = [
  "Strategic Management Process",
  "Management Decisions",
  "Time Scales and Production Development Planning",
  "Structure of the Organization",
  "Activities of the Organization",
  "Analysis of Internal and External Factors for Product Development",
  "SWOT Analysis",
  "Experience Curve",
  "Corporate Strategy and Portfolio Theory",
  "Competitor Analysis",
  "Generic Competitive Strategic Thinking",
  "Globalization and the Virtual Firm",
  "Internet and Information Availability",
  "Sustainability",
  "Age of Discontinuity-New Technologies, Globalization, Cultural Pluralism and Knowledge Capital",
];

const objectives = [
  "Promotion of articles related with Management, Business and Administration domains.",
  "Publication of genuine articles through proper peer review process.",
  "Publishing Special Issues on Conferences.",
  "Preparing online platform for other print Journals.",
  "Empowering the libraries with online and print Journals in MBA domains.",
];

const salientFeatures = [
  "Employs Open Journals System (OJS)-A Journal Management & Publishing System.",
  "Rapid online submission and publication of papers, soon after their formal acceptance/ finalization.",
  "Free online access to the abstracts of all articles.",
  "An effective global web exposure for your Journal.",
  "A chance to preserve your research/review work, online.",
  "An initiative to share and empower knowledge worldwide.",
  "A mode to generate interest in your subject area.",
  "Facilitates linking with the other authors or professionals.",
];

const managementMembers: ManagementPerson[] = [
  { name: "Quaisher J. Hossain", role: "Senior Editor", department: "", photo: "" },
  { name: "Gautam Goswami", role: "Manager", department: "Quality Control", photo: "" },
  { name: "Rahul Kumar", role: "Marketing Manager", department: "STM Conferences", photo: "" },
  { name: "Farha Khan", role: "Commissioning Editor", department: "Nursing", photo: "" },
  { name: "Rishabh Pandey", role: "Assistant Commissioning Editor", department: "Computer Science & Engineering", photo: "" },
  { name: "Akash Gupta", role: "Commissioning Editor", department: "Medical & Pharmacy", photo: "" },
  { name: "Subia Abbasi", role: "Associate Editor", department: "Lifescience & Ayurveda", photo: "" },
  { name: "Neetu Raghav", role: "Commissioning Editor", department: "Architecture", photo: "" },
  { name: "Mansi Srivastava", role: "Commissioning Editor", department: "Mechanical Engineering", photo: "" },
  { name: "Susmita Jahan", role: "Commissioning Editor", department: "Civil Engineering", photo: "" },
  { name: "Chinku Gautam", role: "Associate Editor", department: "Computer Science & Engineering", photo: "" },
  { name: "Shivani Sonkar", role: "Commissioning Editor", department: "Chemistry", photo: "" },
  { name: "Anjul Varshney", role: "Commissioning Editor", department: "Mechanical Engineering", photo: "" },
  { name: "Vanshika Kardam", role: "Associate Editor", department: "Chemical Engineering & Material Science", photo: "" },
  { name: "Gauri Kaushik", role: "Associate Editor", department: "Electrical and Electronic", photo: "" },
  { name: "Alisha", role: "Associate Editor", department: "Biotechnology & Multidisciplinary", photo: "" },
  { name: "Arun Pratap Singh", role: "Associate Editor", department: "Chemistry", photo: "" },
  { name: "Nandini Sahu", role: "Associate Editor", department: "Agriculture", photo: "" },
];

const subscriptionPlans = [
  "Print: Only $44 (Two Print Issues)",
  "Online: Only $149 (Online Access of Current and Back Issues)",
  "Print + Online: $200 (Two Print Issues and Online Access of Current and Back Issues)",
];

const defaultDirectorParagraphs = [
  "We would like to present, with great pleasure, the Twelfth volume of a scholarly International Journal of Industrial Biotechnology and Biomaterials. This journal is part of the Applied Sciences, and is devoted to the scope of present Industrial Biotechnology and Biomaterials issues, from theoretical aspects to application-dependent studies and the validation of emerging technologies. This journal was planned and established to represent the growing needs of Industrial Biotechnology and Biomaterials as an emerging and increasingly vital field, now widely recognized as an integral part of scientific and technical investigations. Its mission is to become a voice of Industrial Biotechnology and Biomaterials, addressing researchers and practitioners in this area.",
  "The core vision of International Journal of Industrial Biotechnology and Biomaterials in JournalsPub is to propagate novel awareness and know-how for the profit of mankind ranging from the academic and professional research societies to industry practitioners in a range of topics in Industrial Biotechnology and Biomaterials in general. JournalsPub acts as a pathfinder for the scientific community to publish their papers at excellently, well-timed & successfully.",
  "International Journals of Industrial Biotechnology and Biomaterials focuses on original high-quality research in the realm of Bioenergy, biofuels, bio-refining, Biomass and feed stocks, Bio-plastics, biofilms, Bio-based chemicals and enzymes, Fermentation and cell culture, Biocatalysis, Environmental microbiology, Natural products discovery and biosynthesis, Drug delivery mechanisms, Sustainable materials, etc.",
  "The Journal is intended as a forum for practitioners and researchers to share the techniques of Industrial Biotechnology and Biomaterials and solutions in the area. Many scientists and researchers have contributed to the creation and success of Industrial Biotechnology and Biomaterials. We are very thankful to everybody within that community who supported the idea of creating an innovative platform. We are certain that this issue will be followed by many others, reporting new developments in the field of Industrial Biotechnology and Biomaterials.",
  "This issue would not have been possible without the great support of the Editorial Board members, and we would like to express our sincere thanks to all of them. We would also like to express our gratitude to the editorial staff of JournalsPub, who supported us at every stage of the project. It is our hope that this fine collection of articles will be a valuable resource for Industrial Biotechnology and Biomaterials readers and will stimulate further research into the vibrant area of Industrial Biotechnology and Biomaterials.",
];

const defaultManuscriptNotice =
  "Manuscript Engine is our specialized platform ensuring a seamless publication flow. Please don't hesitate to reach out to us for any inquiries regarding APID and manuscript submission. You can contact us at info@stmjournals.com.";

const logoAssets = {
  dhruv: {
    src: "/brand/dhruv-info-systems.jpg",
    alt: "Dhruv Info Systems Private Limited",
    width: 924,
    height: 363,
  },
  journalspub: {
    src: "/brand/journalspub.jpg",
    alt: "JournalsPub International Journals Publisher",
    width: 657,
    height: 392,
  },
  stm: {
    src: "/brand/stm-journals.jpg",
    alt: "STM Journals",
    width: 763,
    height: 620,
  },
  mba: {
    src: "/brand/mba-journals.jpeg",
    alt: "MBA Journals",
    width: 248,
    height: 204,
  },
  consortium: {
    src: "/brand/consortium.jpeg",
    alt: "Consortium e-Learning Network",
    width: 325,
    height: 155,
  },
  signature: {
    src: "/brand/puneet-sign.webp",
    alt: "Puneet Mehrotra signature",
    width: 2507,
    height: 1002,
  },
  manuscriptQr: {
    src: "/brand/manuscript-engine-qr.png",
    alt: "QR code for manuscript engine",
    width: 1024,
    height: 1024,
  },
  director: {
    src: "/brand/puneet-sir-director.jpg",
    alt: "Puneet Mehrotra",
    width: 661,
    height: 1149,
  },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function titleCaseName(name: string) {
  return name
    .replace(/^NOLEGEIN/i, "NOLEGEIN")
    .replace(/\b\w+/g, (word) =>
      word === "NOLEGEIN" ? word : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    );
}

function findDynamicValue<T>(journal: Journal, map: Record<string, T>) {
  for (const key of journalLookupKeys(journal)) {
    const value = map[key];
    if (value) return value;
  }
}

function draftFromDynamic(journal: Journal, dynamicData: DynamicBinderData): BinderDraft {
  const details = findDynamicValue(journal, dynamicData.detailsByKey);
  const focus = findDynamicValue(journal, dynamicData.focusByKey);
  const editorialBoard = findDynamicValue(journal, dynamicData.editorialByKey) || [];

  return {
    journalTitle: details?.name || journal.name,
    eIssn: details?.eIssn || journal.eIssn || "2582-2888",
    issueVolume: defaultIssueVolume,
    issueNumber: defaultIssueNumber,
    issueMonthRange: defaultIssueMonthRange,
    issueYear: defaultIssueYear,
    about: focus?.about || details?.about || journal.about || "",
    focusScope: (focus?.focusScope?.length ? focus.focusScope : focusList).slice(0, 5),
    editorialBoard,
    managementHead: {
      name: "Puneet Mehrotra",
      role: "Chairman and Director",
      department: "",
      photo: logoAssets.director.src,
    },
    managementMembers,
    directorTitle: "From the Director's Desk",
    directorName: "Puneet Mehrotra",
    directorRole: "Managing Director",
    directorParagraphs: defaultDirectorParagraphs,
    manuscriptNotice: defaultManuscriptNotice,
    contentRows: contents,
  };
}

function initialDrafts(journals: Journal[], dynamicData: DynamicBinderData) {
  return Object.fromEntries(journals.map((journal) => [journal.id, draftFromDynamic(journal, dynamicData)]));
}

function draftJournal(journal: Journal, draft: BinderDraft): Journal {
  return {
    ...journal,
    name: draft.journalTitle || journal.name,
    eIssn: draft.eIssn || journal.eIssn,
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

function mergeDynamicData(current: DynamicBinderData, next: DynamicBinderData): DynamicBinderData {
  return {
    detailsByKey: { ...current.detailsByKey, ...next.detailsByKey },
    focusByKey: { ...current.focusByKey, ...next.focusByKey },
    editorialByKey: { ...current.editorialByKey, ...next.editorialByKey },
    status: {
      enabled: current.status.enabled || next.status.enabled,
      fetchedAt: next.status.fetchedAt || current.status.fetchedAt,
      errors: [...current.status.errors, ...next.status.errors].filter((error, index, list) => list.indexOf(error) === index),
    },
  };
}

function pageEditorTitle(page: number) {
  const titles = [
    "Cover page journal metadata",
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

function loadSavedDrafts() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(draftStorageKey) || "{}") as Record<string, BinderDraft>;
  } catch {
    return {};
  }
}

function saveDraftsToStorage(drafts: Record<string, BinderDraft>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}

function pdfFileName(journal: Journal | undefined, draft: BinderDraft | null) {
  const base = journal?.abbreviation || journal?.shortName || draft?.journalTitle || "journal";
  const volume = draft?.issueVolume || defaultIssueVolume;
  const issue = draft?.issueNumber || defaultIssueNumber;
  const slug = `${base}-volume-${volume}-issue-${issue}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "journal"}.pdf`;
}

function DownloadButton({ disabled, filename }: { disabled: boolean; filename: string }) {
  const [busy, setBusy] = useState(false);

  async function downloadPdf() {
    const source = document.getElementById("pdf-book");
    if (!source) return;
    setBusy(true);
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const pages = Array.from(source.querySelectorAll<HTMLElement>(".pdf-page"));
    const pdf = new jsPDF("p", "mm", "a4");

    for (let index = 0; index < pages.length; index += 1) {
      const { width, height } = pages[index].getBoundingClientRect();
      const canvas = await html2canvas(pages[index], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width,
        height,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    }

    pdf.save(filename);
    setBusy(false);
  }

  return (
    <button className="primary-action" disabled={disabled || busy} onClick={downloadPdf}>
      <Download size={16} />
      {busy ? "Preparing PDF..." : "Download A4 PDF"}
    </button>
  );
}

function JournalLogo({ journal }: { journal: Journal }) {
  return (
    <div className="journal-logo">
      <span>{initials(journal.abbreviation || journal.name)}</span>
    </div>
  );
}

function PageNumber({ value }: { value: number }) {
  return (
    <span className="page-number">{String(value).padStart(2, "0")}</span>
  );
}

function PdfHeader({ journal, label }: { journal: Journal; label: string }) {
  return (
    <header className="pdf-header">
      <JournalLogo journal={journal} />
      <div>
        <p>{journal.publisher || "MBA Journals"}</p>
        <h2>{titleCaseName(journal.name)}</h2>
      </div>
      <span>{label}</span>
    </header>
  );
}

function ContentHeader({ journal }: { journal: Journal }) {
  return (
    <header className="content-header">
      <div>
        <p>{journal.publisher || "MBA Journals"}</p>
        <h2>{titleCaseName(journal.name)}</h2>
      </div>
      <span>Contents</span>
    </header>
  );
}

function publisherIdentity(journal: Journal) {
  const publisher = journal.publisher || "MBA Journals";
  const imprint = journal.imprint || "MBA Journals, An imprint of Consortium e-Learning Network Pvt. Ltd.";
  const haystack = `${publisher} ${imprint}`.toLowerCase();

  if (haystack.includes("journalspub") || haystack.includes("dhruv")) {
    return {
      publisherName: "JournalsPub",
      companyName: "Dhruv Info Systems Private Limited",
      address:
        "Sales Office: A-118, 2nd Floor, Sector-63, Noida, Uttar Pradesh, PIN 201301, India",
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
      address:
        journal.address ||
        "STM Journals, An imprint of Consortium e-Learning Network Pvt. Ltd. A-118, 1st Floor, Sector-63, Noida, U.P. India, Pin - 201301",
      email: journal.publisherEmail || "info@stmjournals.com",
      phone: journal.publisherPhone || "(+91)-0120-4781-200",
      website: "www.stmjournals.com",
      logoMode: "stm",
    };
  }

  return {
    publisherName: "MBA Journals",
    companyName: "Consortium e-Learning Network Pvt. Ltd.",
    address:
      journal.address ||
      "MBA Journals, An imprint of Consortium e-Learning Network Pvt. Ltd. A-118, 1st Floor, Sector-63, Noida, U.P. India, Pin - 201301",
    email: journal.publisherEmail || "info@mbajournals.in",
    phone: journal.publisherPhone || "91(0)120-4781200/218/219",
    website: "www.mbajournals.in",
    logoMode: "mba",
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

function CoverPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const identity = publisherIdentity(journal);
  const volume = draft.issueVolume || defaultIssueVolume;
  const issue = draft.issueNumber || defaultIssueNumber;
  const monthRange = draft.issueMonthRange || defaultIssueMonthRange;
  const year = draft.issueYear || defaultIssueYear;

  return (
    <section className="pdf-page cover-page" data-page-title="Journal Name with volume issue page">
      <div className="page-rule" />
      <p className="cover-issn">ISSN: {journal.eIssn || "2582-2888"}</p>
      <p className="cover-printer">Printed by : Laxman Printo Graphics, Noida</p>
      <h1>{titleCaseName(journal.name)}</h1>
      <p className="issue-line">Volume {volume} | Issue {issue}</p>
      <p className="cover-meta">{monthRange} | {year}</p>
      <div className="cover-footer">
        <div className="publisher-logo-row">
          <PublisherLogo mode={identity.logoMode} side="publisher" />
          <PublisherLogo mode={identity.logoMode} side="company" />
        </div>
        <b>{identity.publisherName}</b>
        <strong>{identity.companyName}</strong>
        <span>{identity.address}</span>
        <span>Tel. No.: {identity.phone}</span>
        <span>E-mail: {identity.email}; Website: {identity.website}</span>
        <span>Regd. Office: Office No. 4, First Floor, CSC Pocket-E Market, Mayur Vihar, Phase-I, New Delhi-110091</span>
        <span>Website: www.celnet.in; CIN No.: U80302DL2005PTC138759</span>
      </div>
      <PageNumber value={1} />
    </section>
  );
}

function PaymentPage({ journal }: { journal: Journal }) {
  const identity = publisherIdentity(journal);
  const isJournalsPub = identity.logoMode === "journalspub";
  const paymentPublisherName = isJournalsPub ? "Journals Pub" : identity.publisherName;
  const legalPhone = isJournalsPub ? "+91 120-4781200" : identity.phone;

  return (
    <section className="pdf-page payment-reference-page">
      <p>
        {isJournalsPub
          ? "Journals Pub (a division of Dhruv Infosystems Private Ltd.) having its Marketing office located at Office No. 4, First Floor, CSC Pocket E Market, Mayur Vihar Phase II, New Delhi 110091, India, is the Publisher of the Journals. Statements and opinions expressed in the Journal reflect the views of the Author(s) and are not the opinion of Journals Pub unless so stated."
          : "MBA Journals (an imprint of Consortium e-Learning Network Pvt. Ltd.) having its marketing office located at Office No. 4, First Floor, CSC Pocket E Market, Mayur Vihar Phase II, New Delhi 110091, India, is the Publisher of Journals. The author(s) or editor(s) expressed in the Journal reflect the views of the author(s) and are not the opinion of MBA Journals unless so stated."}
      </p>

      <h1>{isJournalsPub ? "SUBSCRIPTION INFORMATION AND ORDER (JANUARYTO DECEMBER, 2026)" : "SUBSCRIPTION INFORMATION AND ORDER (JANUARY TO DECEMBER, 2026)"}</h1>
      <p><b>National Subscription</b></p>
      {isJournalsPub ? (
        <ul className="checkbox-list">
          <li>Print: ₹3500 per Journal (Two Print Issues), Single Issue ₹1800.</li>
          <li>Online: ₹6500 per Journal (Online Access of Current and Back Issues).</li>
          <li>Print + Online: ₹7315 per Journal (Two Print and Online Access of Current and Back Issues).</li>
        </ul>
      ) : (
        <p>
          Print: ₹3500 per Journal (Two Print Issues), Single Issue ₹1800.<br />
          Online: ₹6500 per Journal (Online Access of Current and Back Issues).<br />
          Print + Online: ₹7315 per Journal (Two Print and Online Access of Current and Back Issues).
        </p>
      )}
      {isJournalsPub ? (
        <>
          <p><b>International Subscription</b></p>
          <ul className="checkbox-list">
            {subscriptionPlans.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </>
      ) : (
        <>
          <p>
            <b>International Subscription</b>
          </p>
          <ul className="checkbox-list">
            {subscriptionPlans.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </>
      )}
      <p>
        To purchase print compilation of back issues, please send your query at {identity.email}. Subscription must be
        prepaid. Rates outside of India include delivery. Prices subject to change without notice.
      </p>

      <h2>MODE OF PAYMENT</h2>
      {isJournalsPub ? (
        <p>
          <b>Mode of Payment:</b> At Par Cheque, Demand Draft, and RTGS (payment to be made in favor of
          Dhruv Infosystems Pvt. Ltd., payable at Delhi/New Delhi).
        </p>
      ) : (
        <>
          <p><b>Account Type: HDFC/RTGS/Online Transfer</b></p>
          <p>
            Account Number: 03942000001153<br />
            Account Holder: Consortium e-Learning Network Pvt. Ltd.<br />
            Bank Name: HDFC<br />
            Bank Address: HDFC Bank, Sector-62, Noida, U.P., India<br />
            Bank Location: HDFC0002649, Swift Code: HDFCINBBXXX<br />
            IFSC Code: HDFC0002649
          </p>
          <p>
            <b>Pay Through Cheque/Demand Draft</b><br />
            A/C Payee Cheque, Demand Draft, and RTGS (payment to be made in favor of Consortium e-Learning Network Pvt. Ltd.,
            payable at Delhi/New Delhi).
          </p>
        </>
      )}

      <h2>ONLINE ACCESS POLICY</h2>
      {isJournalsPub ? (
        <>
          <p>
            <b>For Authors</b><br />
            In order to provide maximum citation and wide publicity to the authors work, Journals Pub also have Open
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
      {isJournalsPub ? (
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
      {isJournalsPub ? (
        <p>
          Journals Pub with wide circulation and visibility offer an excellent media for showcasing/promotion of your
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

      <h2>{isJournalsPub ? "LEGAL DISPUTES" : "LEGAL DISPUTE"}</h2>
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
  const scopeItems = (draft.focusScope.length ? draft.focusScope : focusList).slice(0, 5);
  const aboutText = draft.about || journal.about;

  return (
    <section className="pdf-page journal-info-page">
      <div className="journal-info-head">
        <PublisherLogo mode={identity.logoMode} side="publisher" />
        <h1>{titleCaseName(journal.name)}</h1>
      </div>

      <p>
        <b>{identity.publisherName}</b> is a bouquet of research publications which disseminates knowledge dealing with
        domains such as Applied Sciences, Medicine, Engineering, Management and Technology. {aboutText || "We encourage research and thinking, and attempt to contribute to a better perception of academic and professional knowledge across research communities."}
      </p>

      <h2>Objectives</h2>
      <ul>
        {objectives.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <h2>Salient Features</h2>
      <ul>
        {salientFeatures.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <p className="journal-focus-intro">
        <b>{journal.name.toUpperCase()}</b>, is focused towards the rapid publication in the following areas.
      </p>

      <h2>Focus and Scope</h2>
      <ul className="focus-list">
        {scopeItems.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <p>
        Sections covered by this journal are review papers, research papers, interviews, news, companies/institutions
        write-ups, short popular articles and case studies.
      </p>
      <p>
        All contributions to the journal are rigorously refereed and are selected on the basis of quality and originality of
        the work. The journal publishes the most significant new research papers or any other original contribution in the
        form of reviews and reports on new concepts in all areas pertaining to its scope and research being done in the
        world, thus ensuring its scientific priority and significance.
      </p>
      <p>
        No part of this publication may be reproduced, stored in retrieval or transmitted in any form without written
        permission to the publisher.
      </p>
      <p>
        To cite any of the material contained in this journal, in English or translation, please use the full English
        reference at the beginning of each article. To reuse any of the material, please contact {identity.publisherName}.
        The author(s) is/are solely responsible for the content of the article(s) published in the {identity.publisherName}
        platform. The published articles are not constituted or deemed to constitute any representation of view of the
        editors or publisher. The data presented therein are correct or sufficient to support the conclusions reached or
        that the experiment design or methodology is adequate and the information, opinions, views presented in the articles
        reflect the views of the authors and contributors of the article and not the opinion of publisher or the editorial
        board.
      </p>
      <PageNumber value={3} />
    </section>
  );
}

function TeamPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const identity = publisherIdentity(journal);

  return (
    <section className="pdf-page management-page">
      <div className="page-rule" />
      <h1>Publication and Management Team</h1>
      <ManagementProfile person={draft.managementHead} featured />
      <div className="management-band">Members</div>
      <div className="management-photo-grid">
        {draft.managementMembers.map((member, index) => (
          <ManagementProfile key={`${member.name}-${index}`} person={member} />
        ))}
      </div>
      <div className="management-contact-boxes">
        <div>
          <b>For any query related to Dispatch and Online Access, please contact</b>
          <span>Mr. Asan Kumar</span>
          <span>Tel.: +91 120 4781225</span>
          <span>E-mail: asank@celnet.in</span>
          <strong>Website: {identity.website}</strong>
        </div>
        <div>
          <b>For any query related to Sales and Marketing, please contact</b>
          <span>Subscription Manager</span>
          <span>Tel.: +91 120-4781201, +91 9810078958</span>
          <span>E-mail: subs@journalspub.com</span>
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
  return (
    <section className="pdf-page details-page manuscript-page">
      <PdfHeader journal={journal} label="Manuscript Engine" />
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
  const dynamicMembers = draft.editorialBoard;
  const chief = dynamicMembers.find((member) => member.role.toLowerCase().includes("chief"));
  const associateChiefs = dynamicMembers.filter((member) => member.role.toLowerCase().includes("associate"));
  const editors = dynamicMembers.filter(
    (member) =>
      !member.role.toLowerCase().includes("chief") &&
      !member.role.toLowerCase().includes("associate"),
  );
  const fallbackChief = boardMembers[0];
  const fallbackEditors = boardMembers.slice(1, 13);

  return (
    <section className="pdf-page editorial-page">
      <div className="page-rule" />
      <h1>{titleCaseName(journal.name)}</h1>
      <h2>Editorial Board Members</h2>
      <h3>Editor-in-Chief</h3>
      {chief ? <EditorialMemberLine member={chief} /> : <MemberLine member={fallbackChief} />}
      {associateChiefs.length > 0 ? (
        <>
          <h3>Associate Editor-in-Chief</h3>
          <div className="editor-grid">
            {associateChiefs.map((member) => <EditorialMemberLine key={`${member.role}-${member.name}`} member={member} />)}
          </div>
        </>
      ) : null}
      <h3>Editor</h3>
      <div className="editor-grid">
        {editors.length > 0
          ? editors.slice(0, 12).map((member) => <EditorialMemberLine key={`${member.role}-${member.name}`} member={member} />)
          : fallbackEditors.map((member) => <MemberLine key={member[0]} member={member} />)}
      </div>
      <PageNumber value={6} />
    </section>
  );
}

function DirectorPage({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  const paragraphs = draft.directorParagraphs.length ? draft.directorParagraphs : defaultDirectorParagraphs;

  return (
    <section className="pdf-page director-page">
      <div className="page-rule" />
      <h1>{draft.directorTitle}</h1>
      <div className="director-letter">
        <Image
          className="portrait"
          src={logoAssets.director.src}
          alt={logoAssets.director.alt}
          width={logoAssets.director.width}
          height={logoAssets.director.height}
          unoptimized
        />
        <p className="dear-line"><b>Dear Readers,</b></p>
        <p className="director-first-paragraph">{paragraphs[0].replaceAll("{journal}", titleCaseName(journal.name))}</p>
        {paragraphs.slice(1).map((paragraph, index) => (
          <p key={index}>{paragraph.replaceAll("{journal}", titleCaseName(journal.name))}</p>
        ))}
      </div>
      <div className="signature">
        <Image
          src={logoAssets.signature.src}
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

  return (
    <section className="pdf-page content-page">
      <ContentHeader journal={journal} />
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

function MemberLine({ member }: { member: string[] }) {
  return (
    <div className="member-line">
      <b>{member[0]}</b>
      <span>{member[1]}</span>
      <small>{member[2]}</small>
    </div>
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

function BinderPage({ page, journal, draft }: { page: number; journal: Journal; draft: BinderDraft }) {
  const currentJournal = draftJournal(journal, draft);

  switch (page) {
    case 1:
      return <CoverPage journal={currentJournal} draft={draft} />;
    case 2:
      return <PaymentPage journal={currentJournal} />;
    case 3:
      return <JournalDetailsPage journal={currentJournal} draft={draft} />;
    case 4:
      return <TeamPage journal={currentJournal} draft={draft} />;
    case 5:
      return <ManuscriptEnginePage journal={currentJournal} draft={draft} />;
    case 6:
      return <EditorialPage journal={currentJournal} draft={draft} />;
    case 7:
      return <DirectorPage journal={currentJournal} draft={draft} />;
    case 8:
      return <ContentPage journal={currentJournal} draft={draft} />;
    default:
      return <CoverPage journal={currentJournal} draft={draft} />;
  }
}

function PageSet({ journal, draft }: { journal: Journal; draft: BinderDraft }) {
  return (
    <div className="page-set">
      {Array.from({ length: 8 }, (_, index) => (
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
}: {
  journal: Journal;
  draft: BinderDraft;
  dynamicData: DynamicBinderData;
  activePage: number;
  saveStatus: string;
  onChange: (draft: BinderDraft) => void;
  onSave: () => void;
}) {
  const apiKeys = journalLookupKeys(journal);
  const hasDetails = apiKeys.some((key) => dynamicData.detailsByKey[key]);
  const hasFocus = apiKeys.some((key) => dynamicData.focusByKey[key]);
  const hasEditorial = apiKeys.some((key) => dynamicData.editorialByKey[key]);

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

  function updateParagraph(index: number, value: string) {
    onChange({
      ...draft,
      directorParagraphs: draft.directorParagraphs.map((paragraph, paragraphIndex) =>
        paragraphIndex === index ? value : paragraph,
      ),
    });
  }

  function addParagraph() {
    onChange({ ...draft, directorParagraphs: [...draft.directorParagraphs, ""] });
  }

  function useDefaultDirectorLetter() {
    onChange({ ...draft, directorParagraphs: defaultDirectorParagraphs });
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

  function removeManagementMember(index: number) {
    onChange({
      ...draft,
      managementMembers: draft.managementMembers.filter((_, memberIndex) => memberIndex !== index),
    });
  }

  function readPhoto(file: File | undefined, callback: (photo: string) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ""));
    reader.readAsDataURL(file);
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
        <span>{dynamicData.status.enabled ? "Formidable API connected" : "Using local fallback"}</span>
      </div>
      <div className="api-source-grid">
        <span className={hasDetails ? "loaded" : ""}>Journal details</span>
        <span className={hasFocus ? "loaded" : ""}>Focus & scope</span>
        <span className={hasEditorial ? "loaded" : ""}>Editorial board</span>
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
      {activePage === 1 ? (
        <>
          <label>
            <span>Journal title</span>
            <input
              value={draft.journalTitle}
              onChange={(event) => onChange({ ...draft, journalTitle: event.target.value })}
            />
          </label>
          <label>
            <span>e-ISSN</span>
            <input
              value={draft.eIssn}
              onChange={(event) => onChange({ ...draft, eIssn: event.target.value })}
            />
          </label>
          <div className="cover-meta-editor">
            <label>
              <span>Volume</span>
              <input
                value={draft.issueVolume || defaultIssueVolume}
                onChange={(event) => onChange({ ...draft, issueVolume: event.target.value })}
              />
            </label>
            <label>
              <span>Issue</span>
              <input
                value={draft.issueNumber || defaultIssueNumber}
                onChange={(event) => onChange({ ...draft, issueNumber: event.target.value })}
              />
            </label>
            <label>
              <span>Month range</span>
              <input
                value={draft.issueMonthRange || defaultIssueMonthRange}
                onChange={(event) => onChange({ ...draft, issueMonthRange: event.target.value })}
              />
            </label>
            <label>
              <span>Year</span>
              <input
                value={draft.issueYear || defaultIssueYear}
                onChange={(event) => onChange({ ...draft, issueYear: event.target.value })}
              />
            </label>
          </div>
          <div className="editor-note">
            Cover logos, printer line, address, and publisher details are generated from the selected journal and publisher identity.
          </div>
        </>
      ) : null}
      {activePage === 2 ? (
        <div className="editor-note">
          Subscription, payment, online access policy, advertising, lost issue claims, and legal dispute text are publisher-specific generated blocks. These can be split into editable rich text fields in the next pass.
        </div>
      ) : null}
      {activePage === 3 ? (
        <>
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
                  focusScope: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 5),
                })
              }
            />
          </label>
        </>
      ) : null}
      {activePage === 4 ? (
        <div className="editor-repeater">
          <div className="management-edit-head">
            <span>Management head</span>
            <div className="management-edit-row">
              <input value={draft.managementHead.name} onChange={(event) => updateManagementHead({ name: event.target.value })} />
              <input value={draft.managementHead.role} onChange={(event) => updateManagementHead({ role: event.target.value })} />
              <label className="file-field">
                <span>Photo</span>
                <input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0], (photo) => updateManagementHead({ photo }))} />
              </label>
            </div>
          </div>
          <div className="editor-row-head">
            <span>Publication Management Officers ({draft.managementMembers.length})</span>
            <button type="button" onClick={addManagementMember}>Add Member</button>
          </div>
          {draft.managementMembers.map((member, index) => (
            <article className="management-edit-card" key={`${member.name}-${index}`}>
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
        </div>
      ) : null}
      {activePage === 5 ? (
        <label>
          <span>Manuscript submission notification</span>
          <textarea
            rows={9}
            value={draft.manuscriptNotice}
            onChange={(event) => onChange({ ...draft, manuscriptNotice: event.target.value })}
          />
        </label>
      ) : null}
      {activePage === 6 ? (
        <div className="editor-repeater">
          <div className="editor-row-head">
            <span>Editorial Board Members</span>
            <button type="button" onClick={addEditorial}>Add Board Row</button>
          </div>
          {draft.editorialBoard.map((member, index) => (
            <article className="editorial-edit-card" key={`${member.name}-${index}`}>
              <div className="editorial-edit-actions">
                <select value={member.role} onChange={(event) => updateEditorial(index, { role: event.target.value })}>
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
      {activePage === 7 ? (
        <>
          <label>
            <span>Director desk letter title</span>
            <input value={draft.directorTitle} onChange={(event) => onChange({ ...draft, directorTitle: event.target.value })} />
          </label>
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
          <div className="editor-row-head">
            <span>Letter body paragraphs</span>
            <div className="editor-row-actions">
              <button type="button" onClick={useDefaultDirectorLetter}>Use Default Letter</button>
              <button type="button" onClick={addParagraph}>Add Paragraph</button>
            </div>
          </div>
          {draft.directorParagraphs.map((paragraph, index) => (
            <label key={index}>
              <span>Paragraph {index + 1}</span>
              <textarea rows={4} value={paragraph} onChange={(event) => updateParagraph(index, event.target.value)} />
            </label>
          ))}
        </>
      ) : null}
      {activePage === 8 ? (
        <>
          <div className="editor-note">
            If current issue or archive data is not available from API, fill these static rows manually. Saved rows are reused for this journal.
          </div>
          <div className="editor-repeater">
            <div className="editor-row-head">
              <span>Contents / Archive Article Rows ({draft.contentRows.length})</span>
              <button type="button" onClick={addContentRow}>Add Article</button>
            </div>
            {draft.contentRows.map((row, index) => (
              <article className="content-edit-card" key={`${row.title}-${index}`}>
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
            <DownloadButton disabled={false} filename={pdfFileName(journal, draft)} />
          </div>
        </>
      ) : null}
    </section>
  );
}

export default function JournalDashboard({ journals, defaultJournalId, dynamicData }: Props) {
  const [selectedId, setSelectedId] = useState(defaultJournalId);
  const [runtimeDynamicData, setRuntimeDynamicData] = useState(dynamicData);
  const [drafts, setDrafts] = useState<Record<string, BinderDraft>>(() => ({
    ...initialDrafts(journals, dynamicData),
    ...loadSavedDrafts(),
  }));
  const [activePage, setActivePage] = useState(1);
  const [dashboardMode, setDashboardMode] = useState<"templates" | "preview">("templates");
  const [saveStatus, setSaveStatus] = useState("");
  const [journalQuery, setJournalQuery] = useState("");
  const primaryJournal = journals.find((journal) => journal.id === selectedId) || journals[0];
  const selectedJournals = primaryJournal ? [primaryJournal] : [];
  const primaryDraft = primaryJournal ? drafts[primaryJournal.id] || draftFromDynamic(primaryJournal, runtimeDynamicData) : null;
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

  useEffect(() => {
    if (!primaryJournal || !runtimeDynamicData.status.enabled) return;

    const keys = journalLookupKeys(primaryJournal);
    const hasAllSections = keys.some((key) => runtimeDynamicData.detailsByKey[key]) &&
      keys.some((key) => runtimeDynamicData.focusByKey[key]) &&
      keys.some((key) => runtimeDynamicData.editorialByKey[key]);

    if (hasAllSections) return;

    const controller = new AbortController();
    const search = primaryJournal.abbreviation || primaryJournal.name;

    fetch(`/api/binder-data?search=${encodeURIComponent(search)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((nextData: DynamicBinderData) => {
        setRuntimeDynamicData((current) => {
          const merged = mergeDynamicData(current, nextData);
          setDrafts((currentDrafts) => ({
            ...currentDrafts,
            [primaryJournal.id]: loadSavedDrafts()[primaryJournal.id] || currentDrafts[primaryJournal.id] || draftFromDynamic(primaryJournal, merged),
          }));
          return merged;
        });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setRuntimeDynamicData((current) => ({
          ...current,
          status: {
            ...current.status,
            errors: [...current.status.errors, `Runtime Formidable fetch failed: ${error instanceof Error ? error.message : String(error)}`],
          },
        }));
      });

    return () => controller.abort();
  }, [primaryJournal, runtimeDynamicData]);

  function selectJournal(id: string) {
    const journal = journals.find((item) => item.id === id);
    setSelectedId(id);
    setActivePage(1);
    setDashboardMode("templates");
    setJournalQuery("");
    if (journal) {
      setDrafts((current) => ({
        ...current,
        [id]: current[id] || draftFromDynamic(journal, runtimeDynamicData),
      }));
    }
  }

  function updateDraft(journalId: string, draft: BinderDraft) {
    setDrafts((current) => ({ ...current, [journalId]: draft }));
  }

  function saveCurrentDraft() {
    if (!primaryJournal || !primaryDraft) return;
    const nextDrafts = { ...loadSavedDrafts(), ...drafts, [primaryJournal.id]: primaryDraft };
    saveDraftsToStorage(nextDrafts);
    setDrafts((current) => ({ ...current, [primaryJournal.id]: primaryDraft }));
    setSaveStatus(`Saved Page ${activePage} details for ${primaryJournal.abbreviation || primaryJournal.name}`);
    window.setTimeout(() => setSaveStatus(""), 2500);
  }

  return (
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
          <label className="journal-select-label">
            <span>Select journal</span>
            <input
              value={journalQuery}
              onChange={(event) => setJournalQuery(event.target.value)}
              placeholder="Search journal by name, abbreviation, publisher"
            />
            <select value={primaryJournal?.id || ""} onChange={(event) => selectJournal(event.target.value)}>
              {filteredJournals.map((journal) => (
                <option key={journal.id} value={journal.id}>
                  {journal.name} ({journal.abbreviation})
                </option>
              ))}
            </select>
          </label>
        </div>
      </aside>

      <section className="workspace-panel">
        <div className="workspace-toolbar">
          <button className="icon-step" onClick={() => setActivePage((page) => Math.max(1, page - 1))}>
            <ArrowLeft size={16} />
          </button>
          <span>Active editor target:</span>
          <div className="page-stepper">
            {Array.from({ length: 8 }, (_, index) => index + 1).map((page) => (
              <button className={activePage === page ? "active" : ""} key={page} onClick={() => setActivePage(page)}>
                Page {page}
              </button>
            ))}
          </div>
          <button className="icon-step" onClick={() => setActivePage((page) => Math.min(8, page + 1))}>
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
                  <BinderPage page={activePage} journal={primaryJournal} draft={primaryDraft} />
                )}
              </div>
            </section>
            {dashboardMode === "templates" ? (
              <SectionEditor
                journal={primaryJournal}
                draft={primaryDraft}
                dynamicData={runtimeDynamicData}
                activePage={activePage}
                saveStatus={saveStatus}
                onChange={(draft) => updateDraft(primaryJournal.id, draft)}
                onSave={saveCurrentDraft}
              />
            ) : (
              <section className="export-panel">
                <h2>Live Preview & Export</h2>
                <p>Download exports only the active selected journal as an 8-page A4 PDF.</p>
                <div className="toolbar">
                  <button className="secondary-action" onClick={() => window.print()}>
                    <Printer size={16} /> Print
                  </button>
                  <DownloadButton
                    disabled={selectedJournals.length === 0}
                    filename={pdfFileName(primaryJournal, primaryDraft)}
                  />
                </div>
              </section>
            )}
          </div>
        ) : null}

        <div id="pdf-book" className="pdf-export-source" aria-hidden="true">
          {selectedJournals.map((journal) => (
            <PageSet key={journal.id} journal={journal} draft={drafts[journal.id] || draftFromDynamic(journal, runtimeDynamicData)} />
          ))}
        </div>
      </section>
    </main>
  );
}
