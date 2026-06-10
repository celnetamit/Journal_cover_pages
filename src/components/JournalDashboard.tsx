"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Download,
  FileText,
  Printer,
  QrCode,
  Search,
  Users,
} from "lucide-react";
import type { Journal } from "@/lib/journals";

type Props = {
  journals: Journal[];
  defaultJournalId: string;
};

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

const contents = [
  ["Indian Knowledge System and Management in India: An Integrative Perspective", "Bindya S. Soni", "1"],
  ["AI-Enabled Leadership Development and Strategic Organizational Analysis in Higher Education: Emerging HRM and Organizational Behavior Practices for 2026-2027", "Ameya Mohammed Ali", "7"],
  ["Impact of Toxic Leadership in the 21st Century on Employees' Intentions to Leave, with Workplace Bullying as a Mediating Factor", "Amaresh Satpathy, Pranad Ranjan Panda, Swapnamayee Sahoo", "16"],
  ["Standardizing Public Infrastructure Procurement: A Best Practice Trajectory for Nigerian Quantity Surveyors", "Alozie I. Ahmadi", "25"],
  ["Purpose-Driven Startups: A Holistic Leadership Framework for Building Resilient and Scalable Ventures", "Tuhin Mukharjee, Mayank Kumar Dwivedi", "35"],
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

const managementTeam = [
  ["Managing Director", "Puneet Mehrotra", "Strategic publishing direction and journal portfolio governance."],
  ["Publisher Contact", "MBA Journals", "Publication operations, subscriptions, and institutional coordination."],
  ["Principal Contact", "Gaurav Tiwari", "Editorial communication and manuscript coordination."],
  ["Editorial Office", "MBA Journals Editorial Desk", "Peer-review tracking, author assistance, and issue scheduling."],
];

const subscriptionPlans = [
  "Print: Only $44 (Two Print Issues)",
  "Online: Only $149 (Online Access of Current and Back Issues)",
  "Print + Online: $200 (Two Print Issues and Online Access of Current and Back Issues)",
];

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

function DownloadButton({ disabled }: { disabled: boolean }) {
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
      const canvas = await html2canvas(pages[index], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    }

    pdf.save("selected-journal-initial-pages.pdf");
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

function publisherIdentity(journal: Journal) {
  const publisher = journal.publisher || "MBA Journals";
  const imprint = journal.imprint || "MBA Journals, An imprint of Consortium e-Learning Network Pvt. Ltd.";
  const haystack = `${publisher} ${imprint}`.toLowerCase();

  if (haystack.includes("journalspub") || haystack.includes("dhruv")) {
    return {
      publisherName: "JournalsPub",
      companyName: "Dhruv Infosystems Pvt. Ltd.",
      address:
        journal.address ||
        "JournalsPub, An imprint of Dhruv Infosystems Pvt. Ltd. A-118, 2nd Floor, Sector-63, Noida, U.P. India, Pin - 201301",
      email: journal.publisherEmail || "info@journalspub.com",
      phone: journal.publisherPhone || "(+91)-0120-4781-200",
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

function CoverPage({ journal }: { journal: Journal }) {
  const identity = publisherIdentity(journal);

  return (
    <section className="pdf-page cover-page" data-page-title="Journal Name with volume issue page">
      <div className="page-rule" />
      <p className="cover-issn">ISSN: {journal.eIssn || "2582-2888"}</p>
      <p className="cover-printer">Printed by : Laxman Printo Graphics, Noida</p>
      <h1>{titleCaseName(journal.name)}</h1>
      <p className="issue-line">Volume 9 | Issue 1</p>
      <p className="cover-meta">January to June | 2026</p>
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

function PaymentPage() {
  return (
    <section className="pdf-page payment-reference-page">
      <p>
        MBA Journals (an imprint of Consortium e-Learning Network Pvt. Ltd.) having its marketing office located at Office
        No. 4, First Floor, CSC Pocket E Market, Mayur Vihar Phase II, New Delhi 110091, India, is the Publisher of Journals.
        The author(s) or editor(s) expressed in the Journal reflect the views of the author(s) and are not the opinion of MBA
        Journals unless so stated.
      </p>

      <h1>SUBSCRIPTION INFORMATION AND ORDER (JANUARY TO DECEMBER, 2026)</h1>
      <p>
        <b>National Subscription</b><br />
        Online : ₹6500 per Journal (Two Print Issues, Single Issue ₹1800).<br />
        Print + Online : ₹7900 (Online Access of Current and Back Issues).<br />
        Print + Online : ₹7315 per Journal (Two Print and Online Access of Current and Back Issues).
      </p>
      <p>
        <b>International Subscription</b>
      </p>
      <ul className="checkbox-list">
        {subscriptionPlans.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <p>
        To purchase print compilation of back issues, please send your query at info@mbajournals.in. Subscription must be
        prepaid. Rates outside of India include delivery. Prices subject to change without notice.
      </p>

      <h2>MODE OF PAYMENT</h2>
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
      <p>
        <i>Please Send Demand Draft/Cheque to following address:</i><br />
        Consortium e-Learning Network Pvt. Ltd.<br />
        A-118, Level 1, Sector-63, Noida, 201301, U.P., India<br />
        Tel.: +91 120-4781211, +91 9810078958
      </p>

      <h2>ONLINE ACCESS POLICY</h2>
      <p>
        For grant of Open Access publication, maximum citation and wide publicity to the authors work, MBA Journals also
        have Open Access Policy, authors who would like to get their work open access can opt for Optional Open Access
        publication at nominal charges.
      </p>
      <p>
        India, SAARC and African Countries: ₹1500 or $100 including single hard copy of Author&apos;s Journal.<br />
        Other Countries: $200 including single hard copy of Author&apos;s Journal.
      </p>
      <p>
        <b>For Subscribers</b>
      </p>
      <ul className="checkbox-list">
        <li>Online access will be activated within 72 hours of receipt of the payment (working days), subject to receipt of correct information on user details/Static IP address of the subscriber.</li>
        <li>There will be blocking.</li>
        <li>If the user request for the same and furnishes valid reasons for blocking.</li>
        <li>Due to technical issue.</li>
        <li>Misuse of the access rights as per the access policy.</li>
      </ul>

      <h2>ADVERTISING AND COMMERCIAL REPRINT INQUIRIES</h2>
      <p>
        MBA Journals with wide circulation and visibility offer an excellent media for showcasing/promotion of your
        products, services and events namely, Conferences, Symposia/Seminars, etc. These Journals have very high potential
        to deliver the message across the targeted audience regularly with each published issue. The advertisements on bulk
        subscriptions, gift subscriptions or reprint purchases for distribution, etc. are also most welcome.
      </p>

      <h2>LOST ISSUE CLAIMS</h2>
      <p><i>Please note the following when applying for lost or missing issues:</i></p>
      <ul className="checkbox-list">
        <li>Claims for print copies lost will be honored only after 45 days of the dispatch date and before publication of the next issue as per the frequency.</li>
        <li>Tracking ID for the speed post will be provided to all our subscribers and the claims for the missing Journals will be entertained only with the proofs that will be verified at both the ends.</li>
        <li>Claims filed due to insufficient information (or no notice) of change of address will not be honored.</li>
        <li>Change of Address of Dispatch should be intimated to MBA Journals at least two months prior to the dispatch schedule as per the frequency by mentioning subscriber ID and the subscription ID.</li>
        <li>Refund requests will not be entertained.</li>
      </ul>

      <h2>LEGAL DISPUTE</h2>
      <p>
        All the legal disputes are subjected to Delhi Jurisdiction only. If you have any questions, please contact the
        Publication Management Team at info@mbajournals.in; Tel: +91 120-4781200/218219.
      </p>
      <PageNumber value={2} />
    </section>
  );
}

function JournalDetailsPage({ journal }: { journal: Journal }) {
  const identity = publisherIdentity(journal);

  return (
    <section className="pdf-page journal-info-page">
      <div className="journal-info-head">
        <PublisherLogo mode={identity.logoMode} side="publisher" />
        <h1>{titleCaseName(journal.name)}</h1>
      </div>

      <p>
        <b>{identity.publisherName}</b> is a bouquet of research publications which disseminates knowledge dealing with
        domains such as Business, Finance, HRM, Industry, Management and Marketing. We ensure good practice of Management,
        Business and Administration. We encourage research and thinking, and attempt to contribute to a better perception of
        management theories, framework, resources, structures, systems, processes and performance of organizations, as its
        focal point is on research and reflections relevant to academicians and practicing managers.
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
        {focusList.map((item) => <li key={item}>{item}</li>)}
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

function TeamPage({ journal }: { journal: Journal }) {
  const identity = publisherIdentity(journal);

  return (
    <section className="pdf-page management-page">
      <div className="page-rule" />
      <h1>Publication and Management Team</h1>
      <p className="management-intro">
        <b>{identity.publisherName}</b> publishes {titleCaseName(journal.name)} under the imprint of {identity.companyName}.
        The publication and management team coordinates journal production, editorial communication, subscriptions, author
        support, and digital access for readers and contributors.
      </p>
      <div className="management-team-list">
        {managementTeam.map(([role, name, description]) => (
          <article key={role}>
            <h2>{role}</h2>
            <h3>{name}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <div className="management-contact">
        <p><b>Publisher:</b> {journal.publisher || identity.publisherName}</p>
        <p><b>Imprint:</b> {journal.imprint || identity.companyName}</p>
        <p><b>Address:</b> {journal.address || identity.address}</p>
        <p><b>Email:</b> {journal.publisherEmail || identity.email} | <b>Phone:</b> {journal.publisherPhone || identity.phone}</p>
        <p><b>Principal Contact:</b> {journal.editorName || "Gaurav Tiwari"} | <b>Editorial Email:</b> {journal.editorEmail || "info@mbajournals.in"}</p>
      </div>
      <PageNumber value={4} />
    </section>
  );
}

function ManuscriptEnginePage({ journal }: { journal: Journal }) {
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
      <PageNumber value={5} />
    </section>
  );
}

function EditorialPage({ journal }: { journal: Journal }) {
  const chief = boardMembers[0];
  const editors = boardMembers.slice(1, 13);
  return (
    <section className="pdf-page editorial-page">
      <div className="page-rule" />
      <h1>{titleCaseName(journal.name)}</h1>
      <h2>Editorial Board Members</h2>
      <h3>Editor-in-Chief</h3>
      <MemberLine member={chief} />
      <h3>Editor</h3>
      <div className="editor-grid">
        {editors.map((member) => <MemberLine key={member[0]} member={member} />)}
      </div>
      <PageNumber value={6} />
    </section>
  );
}

function DirectorPage({ journal }: { journal: Journal }) {
  return (
    <section className="pdf-page director-page">
      <div className="page-rule" />
      <h1>From the Director&apos;s Desk</h1>
      <div className="director-intro">
        <Image
          className="portrait"
          src={logoAssets.director.src}
          alt={logoAssets.director.alt}
          width={logoAssets.director.width}
          height={logoAssets.director.height}
          unoptimized
        />
        <div>
          <p><b>Dear Readers,</b></p>
          <p>
            We would like to present, with great pleasure, the ninth volume of a scholarly journal,
            <b> {titleCaseName(journal.name)}</b>. This journal is part of the management publishing program from MBA Journals
            and is devoted to the scope of research on management process, from different perspectives. This journal was
            planned and established to represent the growing needs of business management as an emerging and increasingly
            vast field, now widely recognized as an integral part of management.
          </p>
        </div>
      </div>
      <p>
        This vision is to become a voice of the management community, addressing researchers and practitioners in this area.
      </p>
      <p>
        The core vision of <b>{journal.name}</b> is to propagate novel awareness and know-how for the profit of mankind
        ranging from the academic and professional research societies to professionals in a range of topics in Leadership
        and Strategic Management. MBA Journals acts as a pathfinder for the scientific community to publish their papers
        excellently and also online. NOLEGEIN Journal of Leadership and Strategic Management focuses on original high-quality
        research in SWOT Analysis, Experience curve, Sustainability.
      </p>
      <p>
        Many researchers have contributed to the creation and the success of the Leadership and Strategic Management. We are
        very thankful to everybody within this community who supported the idea of creating an innovation platform. We are
        certain that this issue will be followed by many others, reporting new developments in the field of Leadership
        Management.
      </p>
      <p>
        This issue would not have been possible without the great support of the Editorial Board members, and we would like
        to express our sincere thanks to all of them. We would also like to express our gratitude to the editorial staff of
        MBA Journals, who supported us at every stage of the project. It is our hope that this fine collection of articles
        will be a valuable resource for Management readers and will stimulate further research into the vibrant area of
        Leadership Management.
      </p>
      <div className="signature">
        <Image
          src={logoAssets.signature.src}
          alt={logoAssets.signature.alt}
          width={logoAssets.signature.width}
          height={logoAssets.signature.height}
          unoptimized
        />
        <b>Managing Director</b>
      </div>
      <PageNumber value={7} />
    </section>
  );
}

function ContentPage({ journal }: { journal: Journal }) {
  return (
    <section className="pdf-page content-page">
      <PdfHeader journal={journal} label="Contents" />
      <h1>Contents</h1>
      <table className="contents-table">
        <tbody>
          {contents.map(([title, author, page]) => (
            <tr key={title}>
              <td><b>{title}</b><span>{author}</span></td>
              <td>{page}</td>
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

function PageSet({ journal }: { journal: Journal }) {
  return (
    <div className="page-set">
      <CoverPage journal={journal} />
      <PaymentPage />
      <JournalDetailsPage journal={journal} />
      <TeamPage journal={journal} />
      <ManuscriptEnginePage journal={journal} />
      <EditorialPage journal={journal} />
      <DirectorPage journal={journal} />
      <ContentPage journal={journal} />
    </div>
  );
}

export default function JournalDashboard({ journals, defaultJournalId }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([defaultJournalId]);
  const selectedJournals = journals.filter((journal) => selectedIds.includes(journal.id));
  const filtered = useMemo(() => {
    const search = query.toLowerCase();
    return journals
      .filter((journal) => `${journal.name} ${journal.publisher} ${journal.domain}`.toLowerCase().includes(search))
      .slice(0, 80);
  }, [journals, query]);

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <main className="app-shell">
      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <p>Journal Page Builder</p>
            <h1>Create initial journal pages from selected journals</h1>
          </div>
          <div className="toolbar">
            <button className="secondary-action" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </button>
            <DownloadButton disabled={selectedJournals.length === 0} />
          </div>
        </div>
        <div className="stats-row">
          <div><BookOpen size={18} /><b>{journals.length}</b><span>journals loaded</span></div>
          <div><Check size={18} /><b>{selectedJournals.length}</b><span>selected</span></div>
          <div><FileText size={18} /><b>{selectedJournals.length * 8}</b><span>A4 PDF pages</span></div>
          <div><Users size={18} /><b>13</b><span>board members</span></div>
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search journals, publisher, or domain" />
        </label>
        <div className="journal-list">
          {filtered.map((journal) => (
            <button className={selectedIds.includes(journal.id) ? "journal-row selected" : "journal-row"} key={journal.id} onClick={() => toggle(journal.id)}>
              <span className="checkmark">{selectedIds.includes(journal.id) ? "✓" : ""}</span>
              <span><b>{journal.name}</b><small>{journal.publisher || "Publisher not available"} · {journal.abbreviation}</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="preview-panel">
        <div className="preview-heading">
          <h2>Live Preview</h2>
          <p>Eight A4 pages in the same order as the PDF export.</p>
        </div>
        <div id="pdf-book">
          {selectedJournals.map((journal) => <PageSet key={journal.id} journal={journal} />)}
        </div>
      </section>
    </main>
  );
}
