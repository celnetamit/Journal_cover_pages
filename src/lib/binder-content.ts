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
  directorTitle: string;
  directorName: string;
  directorRole: string;
  directorParagraphs: string[];
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

export const subscriptionPlans = [
  "Print: Only $44 (Two Print Issues)",
  "Online: Only $149 (Online Access of Current and Back Issues)",
  "Print + Online: $200 (Two Print Issues and Online Access of Current and Back Issues)",
];

export const defaultDirectorParagraphs = [
  "We would like to present, with great pleasure, the Twelfth volume of a scholarly International Journal of Industrial Biotechnology and Biomaterials. This journal is part of the Applied Sciences, and is devoted to the scope of present Industrial Biotechnology and Biomaterials issues, from theoretical aspects to application-dependent studies and the validation of emerging technologies. This journal was planned and established to represent the growing needs of Industrial Biotechnology and Biomaterials as an emerging and increasingly vital field, now widely recognized as an integral part of scientific and technical investigations. Its mission is to become a voice of Industrial Biotechnology and Biomaterials, addressing researchers and practitioners in this area.",
  "The core vision of International Journal of Industrial Biotechnology and Biomaterials in JournalsPub is to propagate novel awareness and know-how for the profit of mankind ranging from the academic and professional research societies to industry practitioners in a range of topics in Industrial Biotechnology and Biomaterials in general. JournalsPub acts as a pathfinder for the scientific community to publish their papers at excellently, well-timed & successfully.",
  "International Journals of Industrial Biotechnology and Biomaterials focuses on original high-quality research in the realm of Bioenergy, biofuels, bio-refining, Biomass and feed stocks, Bio-plastics, biofilms, Bio-based chemicals and enzymes, Fermentation and cell culture, Biocatalysis, Environmental microbiology, Natural products discovery and biosynthesis, Drug delivery mechanisms, Sustainable materials, etc.",
  "The Journal is intended as a forum for practitioners and researchers to share the techniques of Industrial Biotechnology and Biomaterials and solutions in the area. Many scientists and researchers have contributed to the creation and success of Industrial Biotechnology and Biomaterials. We are very thankful to everybody within that community who supported the idea of creating an innovative platform. We are certain that this issue will be followed by many others, reporting new developments in the field of Industrial Biotechnology and Biomaterials.",
  "This issue would not have been possible without the great support of the Editorial Board members, and we would like to express our sincere thanks to all of them. We would also like to express our gratitude to the editorial staff of JournalsPub, who supported us at every stage of the project. It is our hope that this fine collection of articles will be a valuable resource for Industrial Biotechnology and Biomaterials readers and will stimulate further research into the vibrant area of Industrial Biotechnology and Biomaterials.",
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
  "To cite any of the material contained in this journal, in English or translation, please use the full English reference at the beginning of each article. To reuse any of the material, please contact STM Journals. The author(s) is/are solely responsible for the content of the article(s) published in the STM Journalsplatform. The published articles are not constituted or deemed to constitute any representation of view of the editors or publisher. The data presented therein are correct or sufficient to support the conclusions reached or that the experiment design or methodology is adequate and the information, opinions, views presented in the articles reflect the views of the authors and contributors of the article and not the opinion of publisher or the editorial board.",
];

export const defaultManuscriptNotice =
  "Manuscript Engine is our specialized platform ensuring a seamless publication flow. Please don't hesitate to reach out to us for any inquiries regarding APID and manuscript submission. You can contact us at info@stmjournals.com.";

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
