import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  extractPdfFacts,
  auditBinderPdf,
  auditCoverPdf,
  fuzzyIncludes,
  type PdfAuditContext,
} from "@/lib/binder-pdf-audit";
import type { AssemblyMeta } from "@/lib/binder-files";
import type { Journal } from "@/lib/journals";
import type { BinderDraft } from "@/lib/binder-content";

const A4: [number, number] = [595.28, 841.89];

type PageSpec = {
  lines: string[];
  /** Printed page number drawn bottom-centre. */
  printed?: number;
  size?: [number, number];
};

async function makePdf(pages: PageSpec[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  for (const spec of pages) {
    const page = doc.addPage(spec.size ?? A4);
    const { height, width } = page.getSize();
    let y = height - 72; // 1" top margin
    for (const line of spec.lines) {
      page.drawText(line, { x: 72, y, size: 11, font: times });
      y -= 16;
    }
    if (spec.printed != null) {
      page.drawText(String(spec.printed), { x: width / 2 - 5, y: 36, size: 10, font: times });
    }
  }
  return doc.save();
}

function makeJournal(overrides: Partial<Journal> = {}): Journal {
  return {
    name: "Journal of Testing",
    abbreviation: "JOT",
    type: "National Journal",
    doi: "10.1234",
    ...overrides,
  } as unknown as Journal;
}

const draft = {
  journalTitle: "Journal of Testing",
  journalAbbreviation: "JOT",
  issueVolume: "13",
  issueNumber: "1",
  issueMonthRange: "January–April",
  issueYear: "2026",
} as unknown as Partial<BinderDraft>;

// Two front-matter pages + two 2-page articles (6 pages, even).
function specs(overrides: { article1Lines?: string[]; tocPage1?: string } = {}): {
  pages: PageSpec[];
  assembly: AssemblyMeta;
} {
  const pages: PageSpec[] = [
    { lines: ["Journal of Testing (JOT)", "Volume 13 Issue 1 January–April 2026", "ISSN 2049-3630"] },
    { lines: ["Contents", "First Article Title ... 1", "Second Article Title ... 3"] },
    {
      lines: overrides.article1Lines ?? [
        "First Article Title",
        "Alice Author, Bob Author",
        "Volume 13 Issue 1",
        "DOI: 10.1234/jot.2026.001",
        "Received: 2026-01-02 Accepted: 2026-02-03",
      ],
      printed: 1,
    },
    { lines: ["Body of first article continues here.", "Volume 13 Issue 1"], printed: 2 },
    {
      lines: [
        "Second Article Title",
        "Carol Writer",
        "Volume 13 Issue 1",
        "DOI: 10.1234/jot.2026.002",
        "Received: 2026-01-05 Accepted: 2026-02-06",
      ],
      printed: 3,
    },
    { lines: ["Body of second article continues here.", "Volume 13 Issue 1"], printed: 4 },
  ];
  const assembly: AssemblyMeta = {
    frontMatterPages: 2,
    sourceFileIds: ["fm", "m1", "m2"],
    articles: [
      {
        articleId: "a1",
        title: "First Article Title",
        authors: "Alice Author, Bob Author",
        tocStartPage: overrides.tocPage1 ?? "1",
        startPage: 3,
        endPage: 4,
      },
      {
        articleId: "a2",
        title: "Second Article Title",
        authors: "Carol Writer",
        tocStartPage: "3",
        startPage: 5,
        endPage: 6,
      },
    ],
  };
  return { pages, assembly };
}

function ctx(assembly: AssemblyMeta | null, journal = makeJournal()): PdfAuditContext {
  return { journal, draft, assembly };
}

describe("fuzzyIncludes", () => {
  it("matches when most words are present", () => {
    expect(fuzzyIncludes("The First Article Title appears here", "First Article Title")).toBe(true);
  });
  it("rejects unrelated text", () => {
    expect(fuzzyIncludes("Completely different content", "First Article Title")).toBe(false);
  });
});

describe("extractPdfFacts", () => {
  it("extracts page geometry, text and fonts", async () => {
    const { pages } = specs();
    const facts = await extractPdfFacts(await makePdf(pages));
    expect(facts.pageCount).toBe(6);
    expect(facts.pages[0].text).toContain("Journal of Testing");
    expect(Math.abs(facts.pages[0].widthPt - A4[0])).toBeLessThan(1);
    expect(facts.fonts.some((f) => /times/i.test(f))).toBe(true);
    expect(facts.pages[0].imageOnly).toBe(false);
  });
});

describe("auditBinderPdf", () => {
  it("passes geometry and cross-verification on a clean binder", async () => {
    const { pages, assembly } = specs();
    const facts = await extractPdfFacts(await makePdf(pages));
    const modules = auditBinderPdf(facts, ctx(assembly));

    const geometry = modules.find((m) => m.id === "pdf-geometry")!;
    expect(geometry.items.find((i) => i.label === "Page size")?.status).toBe("pass");
    expect(geometry.items.find((i) => i.label === "Orientation")?.status).toBe("pass");
    expect(geometry.items.find((i) => i.label === "Total binder pages")?.status).toBe("pass");

    const cross = modules.find((m) => m.id === "pdf-cross")!;
    expect(cross.items.find((i) => i.label.startsWith("TOC page numbers"))?.status).toBe("pass");
    expect(cross.items.find((i) => i.label === "Continuous page numbering")?.status).toBe("pass");

    const articles = modules.find((m) => m.id === "pdf-articles")!;
    expect(articles.items.find((i) => i.label === "Article titles on first pages")?.status).toBe("pass");
    expect(articles.items.find((i) => i.label === "DOIs present")?.status).toBe("pass");

    const editorial = modules.find((m) => m.id === "pdf-editorial")!;
    expect(editorial.items[0].status).toBe("pass");
  });

  it("fails on odd page count and junk text", async () => {
    const { pages, assembly } = specs({
      article1Lines: ["First Article Title", "Alice Author", "TODO fix xxxxx before print"],
    });
    pages.push({ lines: ["Stray extra page"] }); // 7 pages → odd
    const facts = await extractPdfFacts(await makePdf(pages));
    const modules = auditBinderPdf(facts, ctx(assembly));

    const geometry = modules.find((m) => m.id === "pdf-geometry")!;
    expect(geometry.items.find((i) => i.label === "Total binder pages")?.status).toBe("fail");

    const editorial = modules.find((m) => m.id === "pdf-editorial")!;
    expect(editorial.items[0].status).toBe("fail");
    expect(editorial.items[0].detail).toContain("p.3");
  });

  it("fails TOC cross-check when the TOC start page is wrong", async () => {
    const { pages, assembly } = specs({ tocPage1: "9" });
    const facts = await extractPdfFacts(await makePdf(pages));
    const modules = auditBinderPdf(facts, ctx(assembly));
    const cross = modules.find((m) => m.id === "pdf-cross")!;
    expect(cross.items.find((i) => i.label.startsWith("TOC page numbers"))?.status).toBe("fail");
  });

  it("flags landscape pages", async () => {
    const { pages, assembly } = specs();
    pages[3] = { ...pages[3], size: [A4[1], A4[0]] };
    const facts = await extractPdfFacts(await makePdf(pages));
    const modules = auditBinderPdf(facts, ctx(assembly));
    const geometry = modules.find((m) => m.id === "pdf-geometry")!;
    expect(geometry.items.find((i) => i.label === "Orientation")?.status).toBe("fail");
  });

  it("requires 'Published by STM Journals' for International journals", async () => {
    const { pages, assembly } = specs();
    const facts = await extractPdfFacts(await makePdf(pages));
    const modules = auditBinderPdf(facts, ctx(assembly, makeJournal({ type: "International Journal", publisher: "Other" } as Partial<Journal>)));
    const cross = modules.find((m) => m.id === "pdf-cross")!;
    expect(cross.items.find((i) => i.label.includes("STM Journals"))?.status).toBe("fail");
  });

  it("defers checks to AI review when no assembly map exists", async () => {
    const { pages } = specs();
    const facts = await extractPdfFacts(await makePdf(pages));
    const modules = auditBinderPdf(facts, ctx(null));
    const articles = modules.find((m) => m.id === "pdf-articles")!;
    expect(articles.items[0].status).toBe("manual");
  });
});

describe("auditCoverPdf", () => {
  const SPREAD: [number, number] = [1224.57, 841.89]; // 432 × 297 mm (210×2 + 12 spine) in points

  it("passes a text cover spread carrying the issue metadata", async () => {
    const facts = await extractPdfFacts(
      await makePdf([
        {
          lines: ["Journal of Testing", "Volume 13 Issue 1", "January–April 2026", "ISSN 2049-3630"],
          size: SPREAD,
        },
      ]),
    );
    const mod = auditCoverPdf(facts, ctx(null));
    expect(mod.id).toBe("pdf-cover");
    expect(mod.items.find((i) => i.label === "Cover pages")?.status).toBe("pass");
    expect(mod.items.find((i) => i.label === "Cover trim size")?.status).toBe("pass");
    expect(mod.items.find((i) => i.label === "Journal title")?.status).toBe("pass");
    expect(mod.items.find((i) => i.label === "ISSNs on cover")?.status).toBe("pass");
  });

  it("warns on an unexpected trim size and fails a missing title", async () => {
    const facts = await extractPdfFacts(
      await makePdf([{ lines: ["Some unrelated words only"], size: [700, 500] }]),
    );
    const mod = auditCoverPdf(facts, ctx(null));
    expect(mod.items.find((i) => i.label === "Cover trim size")?.status).toBe("warn");
    expect(mod.items.find((i) => i.label === "Journal title")?.status).toBe("fail");
  });

  it("defers text checks to AI review for a rasterized cover", async () => {
    const facts = await extractPdfFacts(await makePdf([{ lines: [], size: SPREAD }]));
    const mod = auditCoverPdf(facts, ctx(null));
    expect(mod.items.find((i) => i.label === "Journal title")?.status).toBe("manual");
    expect(mod.items.find((i) => i.label === "ISSNs on cover")?.status).toBe("manual");
  });
});
