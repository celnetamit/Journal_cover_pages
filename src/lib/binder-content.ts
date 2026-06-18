import type { EditorialMember } from "@/lib/formidable";

export type BinderDraft = {
  journalTitle: string;
  journalAbbreviation: string;
  eIssn: string;
  sjif: string;
  icv: string;
  coverImage: string;
  backCoverImage: string;
  journalLogoImage: string;
  footerRightLogoImage: string;
  frontCoverLayout: FrontCoverLayout;
  frontCoverLayoutCustomized?: boolean;
  pageLayouts: BinderPageLayouts;
  journalWebsite: string;
  issueVolume: string;
  issueNumber: string;
  issueMonthRange: string;
  issueYear: string;
  about: string;
  focusScope: string[];
  focusNotes: string[];
  editorialBoard: EditorialMember[];
  managementHead: ManagementPerson;
  managementMembers: ManagementPerson[];
  // Page 5 contact boxes — blank/undefined = fall back to the built-in defaults.
  dispatchContactName?: string;
  dispatchContactPhone?: string;
  dispatchContactEmail?: string;
  salesContactName?: string;
  salesContactPhone?: string;
  salesContactEmail?: string;
  directorTitle: string;
  directorName: string;
  directorRole: string;
  directorParagraphs: string[];
  // Optional uploaded images for the Director's Desk. Blank = use the default asset.
  directorPhotoImage?: string;
  directorSignatureImage?: string;
  manuscriptNotice: string;
  contentRows: ContentRow[];
  // Page 2 (title page) overrides — blank = use the generated publisher default.
  coverPrinter: string;
  publisherAddress: string;
  publisherPhone: string;
  publisherEmail: string;
  publisherWebsite: string;
  registeredOffice: string;
  cin: string;
  // Page 3 (subscription/legal) full-text override — blank = use generated content.
  paymentOverride: string;
};

export type CoverElementId =
  | "abbreviationBadge"
  | "sjifLine"
  | "icvLine"
  | "issn"
  | "issueLine"
  | "websiteLine"
  | "title"
  | "month"
  | "footerLeft"
  | "footerRight";

export type CoverElementLayout = {
  x: number;
  y: number;
};

export type FrontCoverLayout = Record<CoverElementId, CoverElementLayout>;

export type GenericPageElementLayout = {
  x: number;
  y: number;
};

export type JournalInfoElementId =
  | "header"
  | "intro"
  | "objectives"
  | "salient"
  | "focusIntro"
  | "focusList"
  | "notes";

export type TeamElementId =
  | "title"
  | "featured"
  | "band"
  | "grid"
  | "roster"
  | "contacts";

export type ManuscriptElementId =
  | "header"
  | "title"
  | "lead"
  | "engine"
  | "url"
  | "notice";

export type EditorialElementId =
  | "title"
  | "subtitle"
  | "chief"
  | "associate"
  | "editors"
  | "empty";

export type JournalInfoPageLayout = Record<JournalInfoElementId, GenericPageElementLayout>;
export type TeamPageLayout = Record<TeamElementId, GenericPageElementLayout>;
export type ManuscriptPageLayout = Record<ManuscriptElementId, GenericPageElementLayout>;
export type EditorialPageLayout = Record<EditorialElementId, GenericPageElementLayout>;

export type BinderPageLayouts = {
  page2: CoverTitlePageLayout;
  page3: PaymentPageLayout;
  page4: JournalInfoPageLayout;
  page5: TeamPageLayout;
  page6: ManuscriptPageLayout;
  page7: EditorialPageLayout;
  page8: DirectorPageLayout;
  page9: ContentPageLayout;
};

export type CoverTitleElementId =
  | "issn"
  | "printer"
  | "title"
  | "issue"
  | "meta"
  | "footer";

export type PaymentElementId =
  | "override"
  | "intro"
  | "subscription"
  | "payment"
  | "access"
  | "advertising"
  | "lost"
  | "legal";

export type DirectorElementId =
  | "title"
  | "letter"
  | "signature";

export type ContentElementId =
  | "header"
  | "title"
  | "table";

export type CoverTitlePageLayout = Record<CoverTitleElementId, GenericPageElementLayout>;
export type PaymentPageLayout = Record<PaymentElementId, GenericPageElementLayout>;
export type DirectorPageLayout = Record<DirectorElementId, GenericPageElementLayout>;
export type ContentPageLayout = Record<ContentElementId, GenericPageElementLayout>;

export const defaultFrontCoverLayout: FrontCoverLayout = {
  abbreviationBadge: { x: 3.1, y: 4.7 },
  sjifLine: { x: 3.15, y: 9.95 },
  icvLine: { x: 3.15, y: 11.85 },
  issn: { x: 83.4, y: 4.9 },
  issueLine: { x: 68.8, y: 8.7 },
  websiteLine: { x: 68.8, y: 11.9 },
  title: { x: 3.4, y: 16.9 },
  month: { x: 84.1, y: 28.1 },
  footerLeft: { x: 2.6, y: 90.1 },
  footerRight: { x: 82.4, y: 89.9 },
};

export const defaultBinderPageLayouts: BinderPageLayouts = {
  page2: {
    issn: { x: 70.5, y: 8.8 },
    printer: { x: 3.8, y: 66.4 },
    title: { x: 14.8, y: 18.2 },
    issue: { x: 32.8, y: 34.8 },
    meta: { x: 37.5, y: 40.4 },
    footer: { x: 8.8, y: 60.8 },
  },
  page3: {
    override: { x: 8.2, y: 8.2 },
    intro: { x: 8.2, y: 8.2 },
    subscription: { x: 8.2, y: 18.5 },
    payment: { x: 8.2, y: 40.5 },
    access: { x: 8.2, y: 61.5 },
    advertising: { x: 8.2, y: 78.8 },
    lost: { x: 8.2, y: 86.8 },
    legal: { x: 8.2, y: 95.2 },
  },
  page4: {
    header: { x: 8.6, y: 8.2 },
    intro: { x: 8.6, y: 18.6 },
    objectives: { x: 8.6, y: 29.6 },
    salient: { x: 8.6, y: 48.2 },
    focusIntro: { x: 8.6, y: 66.2 },
    focusList: { x: 8.6, y: 71.8 },
    notes: { x: 8.6, y: 84.1 },
  },
  page5: {
    title: { x: 13.6, y: 7.2 },
    featured: { x: 39.5, y: 16.3 },
    band: { x: 7.2, y: 34.4 },
    grid: { x: 7.2, y: 41.8 },
    roster: { x: 13.4, y: 73.2 },
    contacts: { x: 7.2, y: 82.2 },
  },
  page6: {
    header: { x: 8.6, y: 8.1 },
    title: { x: 8.6, y: 22.8 },
    lead: { x: 8.6, y: 29.4 },
    engine: { x: 8.6, y: 38.2 },
    url: { x: 8.6, y: 67.8 },
    notice: { x: 11.4, y: 77.9 },
  },
  page7: {
    title: { x: 8.6, y: 8.1 },
    subtitle: { x: 8.6, y: 20.5 },
    chief: { x: 8.6, y: 31.1 },
    associate: { x: 8.6, y: 45.6 },
    editors: { x: 8.6, y: 60.5 },
    empty: { x: 8.6, y: 31.1 },
  },
  page8: {
    title: { x: 13.8, y: 7.2 },
    letter: { x: 8.2, y: 17.6 },
    signature: { x: 10.2, y: 82.8 },
  },
  page9: {
    header: { x: 8.4, y: 8.2 },
    title: { x: 38.8, y: 20.5 },
    table: { x: 8.4, y: 28.4 },
  },
};

type LegacyFrontCoverLayout = Partial<
  Record<
    | "abbreviation"
    | "issue"
    | "footer",
    Partial<CoverElementLayout>
  >
>;

export function normalizeFrontCoverLayout(
  layout:
    | Partial<Record<CoverElementId, Partial<CoverElementLayout>>>
    | (Partial<Record<CoverElementId, Partial<CoverElementLayout>>> & LegacyFrontCoverLayout)
    | undefined,
): FrontCoverLayout {
  const legacy = layout as LegacyFrontCoverLayout | undefined;
  const abbreviationBase = layout?.abbreviationBadge || legacy?.abbreviation;
  const sjifBase = layout?.sjifLine || legacy?.abbreviation;
  const icvBase = layout?.icvLine || legacy?.abbreviation;
  const issueBase = layout?.issueLine || legacy?.issue;
  const websiteBase = layout?.websiteLine || legacy?.issue;
  const footerLeftBase = layout?.footerLeft || legacy?.footer;
  const footerRightBase = layout?.footerRight || legacy?.footer;

  return {
    abbreviationBadge: {
      ...defaultFrontCoverLayout.abbreviationBadge,
      ...(abbreviationBase || {}),
    },
    sjifLine: {
      ...defaultFrontCoverLayout.sjifLine,
      ...(sjifBase || {}),
    },
    icvLine: {
      ...defaultFrontCoverLayout.icvLine,
      ...(icvBase || {}),
    },
    issn: {
      ...defaultFrontCoverLayout.issn,
      ...(layout?.issn || {}),
    },
    issueLine: {
      ...defaultFrontCoverLayout.issueLine,
      ...(issueBase || {}),
    },
    websiteLine: {
      ...defaultFrontCoverLayout.websiteLine,
      ...(websiteBase || {}),
    },
    title: {
      ...defaultFrontCoverLayout.title,
      ...(layout?.title || {}),
    },
    month: {
      ...defaultFrontCoverLayout.month,
      ...(layout?.month || {}),
    },
    footerLeft: {
      ...defaultFrontCoverLayout.footerLeft,
      ...(footerLeftBase || {}),
    },
    footerRight: {
      ...defaultFrontCoverLayout.footerRight,
      ...(footerRightBase || {}),
    },
  };
}

function normalizeGenericRecord<T extends string>(
  defaults: Record<T, GenericPageElementLayout>,
  layout: Partial<Record<T, Partial<GenericPageElementLayout>>> | undefined,
): Record<T, GenericPageElementLayout> {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, rawValue]) => [
      key,
      { ...(rawValue as GenericPageElementLayout), ...(layout?.[key as T] || {}) },
    ]),
  ) as Record<T, GenericPageElementLayout>;
}

export function normalizeBinderPageLayouts(
  layouts: Partial<{
    page2: Partial<Record<CoverTitleElementId, Partial<GenericPageElementLayout>>>;
    page3: Partial<Record<PaymentElementId, Partial<GenericPageElementLayout>>>;
    page4: Partial<Record<JournalInfoElementId, Partial<GenericPageElementLayout>>>;
    page5: Partial<Record<TeamElementId, Partial<GenericPageElementLayout>>>;
    page6: Partial<Record<ManuscriptElementId, Partial<GenericPageElementLayout>>>;
    page7: Partial<Record<EditorialElementId, Partial<GenericPageElementLayout>>>;
    page8: Partial<Record<DirectorElementId, Partial<GenericPageElementLayout>>>;
    page9: Partial<Record<ContentElementId, Partial<GenericPageElementLayout>>>;
  }> | undefined,
): BinderPageLayouts {
  const legacyPage8 = layouts?.page8 as Partial<Record<"intro" | "body", Partial<GenericPageElementLayout>>> | undefined;
  return {
    page2: normalizeGenericRecord(defaultBinderPageLayouts.page2, layouts?.page2),
    page3: normalizeGenericRecord(defaultBinderPageLayouts.page3, layouts?.page3),
    page4: normalizeGenericRecord(defaultBinderPageLayouts.page4, layouts?.page4),
    page5: normalizeGenericRecord(defaultBinderPageLayouts.page5, layouts?.page5),
    page6: normalizeGenericRecord(defaultBinderPageLayouts.page6, layouts?.page6),
    page7: normalizeGenericRecord(defaultBinderPageLayouts.page7, layouts?.page7),
    page8: normalizeGenericRecord(defaultBinderPageLayouts.page8, {
      ...(layouts?.page8 || {}),
      letter: layouts?.page8?.letter || legacyPage8?.intro || legacyPage8?.body || defaultBinderPageLayouts.page8.letter,
    }),
    page9: normalizeGenericRecord(defaultBinderPageLayouts.page9, layouts?.page9),
  };
}

export type ManagementPerson = {
  name: string;
  role: string;
  department: string;
  photo: string;
};

export type ContentRow = {
  title: string;
  author: string;
  page: string;
};

export const boardMembers = [
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

export const contents: ContentRow[] = [
  { title: "Indian Knowledge System and Management in India: An Integrative Perspective", author: "Bindya S. Soni", page: "1" },
  { title: "AI-Enabled Leadership Development and Strategic Organizational Analysis in Higher Education: Emerging HRM and Organizational Behavior Practices for 2026-2027", author: "Ameya Mohammed Ali", page: "7" },
  { title: "Impact of Toxic Leadership in the 21st Century on Employees' Intentions to Leave, with Workplace Bullying as a Mediating Factor", author: "Amaresh Satpathy, Pranad Ranjan Panda, Swapnamayee Sahoo", page: "16" },
  { title: "Standardizing Public Infrastructure Procurement: A Best Practice Trajectory for Nigerian Quantity Surveyors", author: "Alozie I. Ahmadi", page: "25" },
  { title: "Purpose-Driven Startups: A Holistic Leadership Framework for Building Resilient and Scalable Ventures", author: "Tuhin Mukharjee, Mayank Kumar Dwivedi", page: "35" },
];

export const focusList = [
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

export const objectives = [
  "Promotion of articles related with Management, Business and Administration domains.",
  "Publication of genuine articles through proper peer review process.",
  "Publishing Special Issues on Conferences.",
  "Preparing online platform for other print Journals.",
  "Empowering the libraries with online and print Journals in MBA domains.",
];

export const salientFeatures = [
  "Employs Open Journals System (OJS)-A Journal Management & Publishing System.",
  "Rapid online submission and publication of papers, soon after their formal acceptance/ finalization.",
  "Free online access to the abstracts of all articles.",
  "An effective global web exposure for your Journal.",
  "A chance to preserve your research/review work, online.",
  "An initiative to share and empower knowledge worldwide.",
  "A mode to generate interest in your subject area.",
  "Facilitates linking with the other authors or professionals.",
];

export const lawObjectives = [
  "Promotion of research works in the field of Law and legality.",
  "To publish articles that inspire thought and insight of the major issues related to Law.",
  "Empowering the libraries with online and print Journals in legal domain.",
  "Publication of original research, review, short articles and case studies through peer review process.",
  "To reach readers worldwide who are interested in legal research and legal issues through the Open Access system.",
];

export const lawSalientFeatures = [
  "A bouquet of 15 Journals sharing all aspects of legal knowledge.",
  "Employs Open Journals System (OJS)-A Journal Management & Publishing System.",
  "Worldwide circulation and visibility.",
  "Presents an opportunity for unbiased reflection on particular legal developments and issues.",
  "Rapid online submission and publication of papers, soon after their formal acceptance/finalization.",
];

export const lawJournalNames = [
  "National Journal of Criminal Law",
  "Journal of Family and Adoption Law",
  "Journal of Banking and Insurance Law",
  "National Journal of Real Estate Law",
  "National Journal of Environmental Law",
  "National Journal of Cyber Security Law",
  "Indian Journal of Health & Medical Law",
  "Journal of Human Rights Law and Practice",
  "Journal of Intellectual Property Rights Law",
  "Journal of Capital Market and Securities Law",
  "Journal of Constitutional Law & Jurisprudence",
  "Journal of Taxation and Regulatory Framework",
  "National Journal of Labour and Industrial Law",
  "Journal of Law of Torts and Consumer Protection Law",
  "Journal of Corporate Governance and International Business Law",
];

export const managementMembers: ManagementPerson[] = [
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

export const lawManagementMembers: ManagementPerson[] = [
  { name: "Dr. Archana Mehrotra", role: "Group Managing Editor and Managing Director", department: "CELNET, Delhi, India", photo: "" },
  { name: "Quaisher J. Hossain", role: "Senior Editor", department: "", photo: "" },
  { name: "Gagan Kumar", role: "Associate Editor", department: "Law Journals | cle@celnet.in", photo: "" },
  { name: "Gautam Goswami", role: "Manager", department: "Quality Control", photo: "" },
];

export type Page5Contacts = {
  dispatchContactName: string;
  dispatchContactPhone: string;
  dispatchContactEmail: string;
  salesContactName: string;
  salesContactPhone: string;
  salesContactEmail: string;
};

// Built-in defaults for the two Page 5 contact boxes. Sales details differ for
// law journals; everything is overridable per issue via the draft.
export function defaultPage5Contacts(isLaw: boolean): Page5Contacts {
  return {
    dispatchContactName: "Mr. Asan Kumar",
    dispatchContactPhone: "+91 120 4781225",
    dispatchContactEmail: "asank@celnet.in",
    salesContactName: "Subscription Manager",
    salesContactPhone: `${isLaw ? "+91 120-4781211" : "+91 120-4781201"}, +91 9810078958`,
    salesContactEmail: isLaw ? "subscriptions@stmjournals.com" : "subs@journalspub.com",
  };
}

export const subscriptionPlans = [
  "Print: Only $44 (Two Print Issues)",
  "Online: Only $149 (Online Access of Current and Back Issues)",
  "Print + Online: $200 (Two Print Issues and Online Access of Current and Back Issues)",
];

// Generic, journal-agnostic letter. Tokens ({journal}, {volume}, {domain},
// {publisher}) are filled at render time, so the default reads correctly for any
// journal; it can be overridden per-issue or on the Company in Setup.
export const defaultDirectorParagraphs = [
  "We are delighted to present, with great pleasure, the {volume} volume of {journal}. Part of the {domain} domain, the journal is devoted to the present scope of its field — from theoretical aspects to application-dependent studies and the validation of emerging technologies. It was established to represent the growing needs of an increasingly vital discipline, now widely recognized as an integral part of scientific and technical investigation, and to become a voice for researchers and practitioners in this area.",
  "The core vision of {journal}, published by {publisher}, is to propagate novel awareness and know-how for the benefit of all — from academic and professional research societies to industry practitioners across the journal's range of topics. {publisher} acts as a pathfinder for the scientific community to publish their work excellently, in a timely manner, and successfully.",
  "{journal} focuses on original, high-quality research across the breadth of its scope, welcoming review papers, research papers, case studies and reports on new concepts and developments in the field.",
  "The journal is intended as a forum for practitioners and researchers to share techniques and solutions in the area. Many scholars have contributed to its creation and success, and we are thankful to everyone in the community who supported the idea of this platform. We are certain this issue will be followed by many others, reporting new developments in the field.",
  "This issue would not have been possible without the great support of our Editorial Board members, to whom we express our sincere thanks. We are also grateful to the editorial staff of {publisher}, who supported us at every stage. It is our hope that this fine collection of articles will be a valuable resource for our readers and will stimulate further research into this vibrant area.",
];

export const lawDirectorParagraphs = [
  "It is my privilege to present the print version of the {journal}. The intention of this journal is to create an atmosphere that stimulates vision and research in the area of law and legal studies.",
  "Law Journals aims to provide an academic medium and an important reference for the advancement and dissemination of research results that support high-level learning, teaching, and research in legal domains.",
  "Lastly, I would like to express my sincere gratitude to our Editorial/Review Board, authors and publication team for their continued support, invaluable contributions and suggestions in the form of authoring writeups, reviewing, and providing constructive comments for the advancement of the journals.",
  "I hope you will enjoy reading this issue and we welcome your feedback on any aspect of the Journal.",
];

export const defaultFocusNotes = [
  "Sections covered by this journal are review papers, research papers, interviews, news, companies/institutions write-ups, short popular articles and case studies.",
  "All contributions to the journal are rigorously refereed and are selected on the basis of quality and originality of the work. The journal publishes the most significant new research papers or any other original contribution in the form of reviews and reports on new concepts in all areas pertaining to its scope and research being done in the world, thus ensuring its scientific priority and significance.",
  "No part of this publication may be reproduced, stored in retrieval or transmitted in any form without written permission to the publisher.",
  "To cite any of the material contained in this journal, in English or translation, please use the full English reference at the beginning of each article. To reuse any of the material, please contact {publisher}. The author(s) is/are solely responsible for the content of the article(s) published in the {publisher} platform. The published articles are not constituted or deemed to constitute any representation of view of the editors or publisher. The data presented therein are correct or sufficient to support the conclusions reached or that the experiment design or methodology is adequate and the information, opinions, views presented in the articles reflect the views of the authors and contributors of the article and not the opinion of publisher or the editorial board.",
];

export const defaultManuscriptNotice =
  "Manuscript Engine is our specialized platform ensuring a seamless publication flow. Please don't hesitate to reach out to us for any inquiries regarding APID and manuscript submission. You can contact us at info@stmjournals.com.";

// Shared content for the Manuscript page — the same engine for every journal,
// edited once in /admin/manuscript-engine. Per-journal bits (QR URL, notice)
// stay on the Journal; these are the global instructional parts + logo.
export type ManuscriptEngineSettings = {
  heading: string;
  leadText: string;
  steps: string[];
  scanLabel: string;
  logoUrl: string;
};

export const defaultManuscriptEngine: ManuscriptEngineSettings = {
  heading: "Manuscript Engine",
  leadText:
    "Authors can submit manuscripts, track review progress, view decisions, and communicate with the editorial office through the journal manuscript engine.",
  steps: [
    "Create or log in to the author account.",
    "Select the journal and manuscript article type.",
    "Upload manuscript, author declaration, and required files.",
    "Confirm submission and track the peer-review workflow.",
  ],
  scanLabel: "Scan to open manuscript page",
  logoUrl: "",
};

export const logoAssets = {
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
  law: {
    src: "/brand/law-journals.jpeg",
    alt: "Law Journals",
    width: 244,
    height: 148,
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
