"use client";

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

const focusItems = [
  ["Strategic Management Process", "Competence-based, sustainability, Balanced scorecard, Performance measurement, Strategic decision-making, Information systems success, Multidimensional metrics, Case studies, Project management, Customer service management, Project success and strategy."],
  ["Management decisions", "Decision making, Affect, Emotions, Cognition, Literature review, Health service, Operational strategy, Consumer choice, Organizational efficiency, Behavioural strategy, Feedback, policy, practice and knowledge."],
  ["Time scales and product development planning", "New product development, Marketing manufacturing integration, Product development process, Portfolio diversification, Consumer-oriented technology, Expert system, Database and product life cycle."],
  ["Structure of the organization", "Co-authorship, Strategic management, Social network analysis, Organizational structure, Alliance systems, Supply chain management, Leadership and public sector organizations."],
  ["Activities of the organization", "Corporate entrepreneurship, Middle managers, Entrepreneurial environment, Network, conversation analysis, Technology acceptance, Multinational corporations and marketing."],
  ["Analysis of Internal and external factors for product development", "Strategic orientation, Innovation speed, Knowledge sharing practices, Fuzzy logic, Product management and organizational competence."],
  ["SWOT Analysis", "SWOT analysis, Importance-performance analysis, Customer satisfaction surveys, Sustainable energy, Risk, Integrated planning and green manufacturing."],
  ["Experience curve", "Combined cycle gas turbine, Electricity generation cost, Decision support model, Product diversification, Social entrepreneurship, Performance and technology innovation."],
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

function KeyValueGrid({ rows }: { rows: string[][] }) {
  return (
    <dl className="kv-grid">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value || "Not available"}</dd>
        </div>
      ))}
    </dl>
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
        <div className="publisher-logo dhruv-logo">
          <strong>Dhruv</strong>
          <span>Infosystems</span>
        </div>
      );
    }

    return (
      <div className="publisher-logo consortium-logo">
        <strong>C</strong>
        <span>Consortium<br />e-Learning<br />Network</span>
      </div>
    );
  }

  if (mode === "journalspub") {
    return (
      <div className="publisher-logo journalspub-logo">
        <strong>Journals</strong>
        <span>Pub</span>
      </div>
    );
  }

  if (mode === "stm") {
    return (
      <div className="publisher-logo stm-logo">
        <strong>STM</strong>
        <span>Journals</span>
      </div>
    );
  }

  return (
    <div className="publisher-logo mba-logo">
      <strong>MBA</strong>
      <span>JOURNALS</span>
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
  return (
    <section className="pdf-page focus-page">
      <PdfHeader journal={journal} label="Journal Details" />
      <h1>Journal Details, Focus and Scope</h1>
      <KeyValueGrid
        rows={[
          ["Title", journal.name],
          ["Abbreviation", journal.abbreviation],
          ["E-ISSN", journal.eIssn],
          ["Publisher", journal.publisher],
          ["Started Since", journal.startedSince],
          ["Issues Per Year", journal.issuesPerYear || "3 Issues"],
          ["Publication Format", journal.access],
          ["DOI", journal.doi],
        ]}
      />
      <h2>Focus & Scope</h2>
      {focusItems.slice(0, 6).map(([title, body]) => (
        <p key={title}><b>{title}:</b> {body}</p>
      ))}
      <PageNumber value={3} />
    </section>
  );
}

function TeamPage({ journal }: { journal: Journal }) {
  return (
    <section className="pdf-page details-page">
      <PdfHeader journal={journal} label="Team" />
      <h1>Publication and Management Team</h1>
      <div className="team-list">
        {managementTeam.map(([role, name, description]) => (
          <article key={role}>
            <span>{role}</span>
            <h2>{name}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <h2>Publisher Contact</h2>
      <KeyValueGrid
        rows={[
          ["Publisher", journal.publisher || "MBA Journals"],
          ["Imprint", journal.imprint],
          ["Address", journal.address],
          ["Email", journal.publisherEmail || "info@stmjournals.com"],
          ["Phone", journal.publisherPhone || "(+91)-120-4781-200"],
          ["Principal Contact", journal.editorName || "Gaurav Tiwari"],
          ["Editorial Email", journal.editorEmail || "info@mbajournals.in"],
        ]}
      />
      <PageNumber value={4} />
    </section>
  );
}

function FakeQr({ value }: { value: string }) {
  const cells = Array.from({ length: 121 }, (_, index) => {
    const code = value.charCodeAt(index % value.length);
    return (code + index * 7 + Math.floor(index / 11)) % 3 !== 0;
  });

  return (
    <div className="qr-box" aria-label="QR code">
      {cells.map((filled, index) => <span className={filled ? "filled" : ""} key={index} />)}
    </div>
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
          <FakeQr value={url} />
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
      <PdfHeader journal={journal} label="Editorial Board" />
      <h1>Editorial Board Members</h1>
      <h2>Editor-in-Chief</h2>
      <MemberLine member={chief} />
      <h2>Editors</h2>
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
      <PdfHeader journal={journal} label="Director&apos;s Desk" />
      <h1>From the Director&apos;s Desk</h1>
      <div className="director-intro">
        <div className="portrait">PM</div>
        <p><b>Dear Readers,</b></p>
      </div>
      <p>
        We would like to present, with great pleasure, the ninth volume of a scholarly journal,
        <b> {titleCaseName(journal.name)}</b>. This journal is part of the management publishing program from MBA Journals and is devoted to research in business management and strategic leadership.
      </p>
      <p>
        The core vision of <b>{journal.name}</b> is to propagate novel awareness and know-how for the profit of mankind ranging from the academic and professional research societies to professionals in leadership, strategic planning, and management studies.
      </p>
      <p>
        Many researchers have contributed to the creation and success of the journal. We are thankful to everybody within this community who supported the idea of creating an innovation platform.
      </p>
      <p>
        This issue would not have been possible without the support of the Editorial Board members, reviewers, authors, and readers who continue to strengthen the research community.
      </p>
      <div className="signature">Puneet Mehrotra<br /><b>Managing Director</b></div>
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
