// Deterministic (rule-based) QA over the ASSEMBLED binder PDF.
//
// Complements binder-audit.ts (which audits the *draft data*): this module
// inspects the actual merged PDF — page geometry, fonts, junk text, headers/
// footers, printed page numbers, and TOC↔article cross-verification — and
// produces AuditModules of the same shape so the existing report UI renders
// them unchanged.
//
// The app's own front-matter export is rasterized (html2canvas), so those
// pages usually carry no extractable text. Image-only pages are detected and
// their text-level checks are deferred to the AI review layer instead of
// being failed here.
//
// Kept free of "server-only" so vitest can exercise it directly.

import type { Journal } from "@/lib/journals";
import type { BinderDraft } from "@/lib/binder-content";
import {
  JUNK_PATTERNS,
  isValidIssn,
  type AuditItem,
  type AuditModule,
  type AuditStatus,
} from "@/lib/binder-audit";
import { inlineToPlainText } from "@/lib/rich-text";
import type { AssemblyMeta } from "@/lib/binder-files";

// ---------------------------------------------------------------------------
// PDF fact extraction (pdfjs-dist)
// ---------------------------------------------------------------------------

export type PdfTextItem = {
  text: string;
  x: number;
  y: number; // PDF user space: origin bottom-left, y grows upward
  width: number;
  height: number;
  fontName: string; // resolved font name when available (e.g. "TimesNewRomanPSMT")
  fontSize: number; // pt
};

export type PdfImageFact = {
  pixelWidth: number;
  pixelHeight: number;
  /** Placed size on the page in points; null when the transform could not be tracked. */
  placedWidthPt: number | null;
  placedHeightPt: number | null;
  /** Effective print resolution; null when placement is unknown. */
  dpi: number | null;
};

export type PdfPageFacts = {
  /** 1-indexed page number in the assembled binder. */
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  items: PdfTextItem[];
  images: PdfImageFact[];
  /** All text on the page, space-joined. Empty for rasterized pages. */
  text: string;
  /** True when the page has images but no extractable text (rasterized page). */
  imageOnly: boolean;
};

export type PdfFacts = {
  pageCount: number;
  pages: PdfPageFacts[];
  /** Distinct resolved font names across all pages. */
  fonts: string[];
};

const PT_PER_MM = 72 / 25.4;
const PT_PER_IN = 72;

export async function extractPdfFacts(bytes: Uint8Array): Promise<PdfFacts> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: true }).promise;
  const OPS = pdfjs.OPS;

  const pages: PdfPageFacts[] = [];
  const fonts = new Set<string>();

  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });

    // Operator list first: it resolves font/image objects into page.commonObjs
    // and page.objs, and lets us track image placement transforms.
    const opList = await page.getOperatorList();
    const content = await page.getTextContent();

    // Resolve internal font ids (g_d0_f1 …) to real font names where possible.
    const fontNameById = new Map<string, string>();
    const resolveFont = (id: string): string => {
      const cached = fontNameById.get(id);
      if (cached) return cached;
      let resolved = id;
      try {
        const font = page.commonObjs.has(id) ? (page.commonObjs.get(id) as { name?: string }) : null;
        if (font?.name) resolved = font.name;
      } catch {
        // keep internal id
      }
      fontNameById.set(id, resolved);
      return resolved;
    };

    const items: PdfTextItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw)) continue;
      const t = raw.transform as number[];
      const fontSize = Math.hypot(t[2], t[3]) || Math.abs(t[3]) || 0;
      const name = resolveFont(raw.fontName as string);
      if (raw.str.trim()) fonts.add(name);
      items.push({
        text: raw.str,
        x: t[4],
        y: t[5],
        width: raw.width as number,
        height: raw.height as number,
        fontName: name,
        fontSize,
      });
    }

    // Walk the operator list tracking the CTM so each drawn image's placed
    // size (→ effective dpi) can be computed. Best-effort: unknown constructs
    // leave placedSize null rather than guessing.
    const images: PdfImageFact[] = [];
    type Matrix = [number, number, number, number, number, number];
    const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
    const mul = (m: Matrix, n: Matrix): Matrix => [
      m[0] * n[0] + m[1] * n[2],
      m[0] * n[1] + m[1] * n[3],
      m[2] * n[0] + m[3] * n[2],
      m[2] * n[1] + m[3] * n[3],
      m[4] * n[0] + m[5] * n[2] + n[4],
      m[4] * n[1] + m[5] * n[3] + n[5],
    ];
    let ctm: Matrix = IDENTITY;
    const stack: Matrix[] = [];

    for (let op = 0; op < opList.fnArray.length; op += 1) {
      const fn = opList.fnArray[op];
      const args = opList.argsArray[op];
      if (fn === OPS.save) stack.push(ctm);
      else if (fn === OPS.restore) ctm = stack.pop() ?? IDENTITY;
      else if (fn === OPS.transform) ctm = mul(args as Matrix, ctm);
      else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        let pixelWidth = 0;
        let pixelHeight = 0;
        try {
          if (fn === OPS.paintImageXObject) {
            const id = (args as [string])[0];
            const img = page.objs.has(id)
              ? (page.objs.get(id) as { width?: number; height?: number })
              : null;
            pixelWidth = img?.width ?? 0;
            pixelHeight = img?.height ?? 0;
          } else {
            const img = (args as [{ width?: number; height?: number }])[0];
            pixelWidth = img?.width ?? 0;
            pixelHeight = img?.height ?? 0;
          }
        } catch {
          // leave 0 — treated as unmeasurable
        }
        // An image paints the unit square through the CTM.
        const placedW = Math.hypot(ctm[0], ctm[1]);
        const placedH = Math.hypot(ctm[2], ctm[3]);
        const measurable = pixelWidth > 0 && placedW > 1 && placedH > 1;
        images.push({
          pixelWidth,
          pixelHeight,
          placedWidthPt: measurable ? placedW : null,
          placedHeightPt: measurable ? placedH : null,
          dpi: measurable ? Math.min(pixelWidth / (placedW / PT_PER_IN), pixelHeight / (placedH / PT_PER_IN)) : null,
        });
      }
    }

    const text = items
      .map((it) => it.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber: i,
      widthPt: viewport.width,
      heightPt: viewport.height,
      items,
      images,
      text,
      imageOnly: text.length === 0 && images.length > 0,
    });
    page.cleanup();
  }

  await doc.cleanup();
  return { pageCount: pages.length, pages, fonts: Array.from(fonts) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const plain = (v: string | null | undefined) => inlineToPlainText(v ?? "").trim();

/** Escape a user-supplied string for interpolation into a RegExp. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ISSN-shaped strings (checksum validated separately by isValidIssn). */
const ISSN_SCAN_RE = /\b\d{4}[‒–—-]\d{3}[\dXx]\b/g;

/**
 * Loose containment: does the haystack contain most words of the needle?
 * Short words are noise and are dropped — EXCEPT pure numbers, which are
 * usually the payload (volume/issue numbers, years): "Volume 7" must not
 * degenerate to just "volume".
 */
export function fuzzyIncludes(haystack: string, needle: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const h = ` ${norm(haystack)} `;
  const words = norm(needle).split(" ").filter((w) => w.length > 2 || /^\d+$/.test(w));
  if (!words.length) return false;
  // Numbers must match as whole tokens ("7" must not match inside "2017").
  const hits = words.filter((w) => (/^\d+$/.test(w) ? h.includes(` ${w} `) : h.includes(w))).length;
  return hits / words.length >= 0.6;
}

function mmOf(pt: number): number {
  return pt / PT_PER_MM;
}

/** Dominant (text-length-weighted) font size among items, or null. */
function dominantFontSize(items: PdfTextItem[]): number | null {
  const weight = new Map<number, number>();
  for (const it of items) {
    if (!it.text.trim() || it.fontSize <= 0) continue;
    const size = Math.round(it.fontSize * 2) / 2; // bucket to 0.5pt
    weight.set(size, (weight.get(size) ?? 0) + it.text.trim().length);
  }
  let best: number | null = null;
  let bestW = 0;
  for (const [size, w] of weight) {
    if (w > bestW) {
      best = size;
      bestW = w;
    }
  }
  return best;
}

/** Printed page number: a short pure-number item near the bottom centre. */
function printedPageNumber(page: PdfPageFacts): number | null {
  const bottomBand = 60; // pt from the bottom edge
  const midLo = page.widthPt / 3;
  const midHi = (page.widthPt * 2) / 3;
  for (const it of page.items) {
    const text = it.text.trim();
    if (!/^\d{1,4}$/.test(text)) continue;
    if (it.y > bottomBand) continue;
    const centre = it.x + it.width / 2;
    if (centre >= midLo && centre <= midHi) return Number.parseInt(text, 10);
  }
  return null;
}

function item(label: string, status: AuditStatus, requirement: string, detail: string): AuditItem {
  return { label, status, requirement, detail };
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export type PdfAuditContext = {
  journal: Journal;
  draft: Partial<BinderDraft>;
  assembly: AssemblyMeta | null;
};

export function auditBinderPdf(facts: PdfFacts, ctx: PdfAuditContext): AuditModule[] {
  return [
    moduleGeometry(facts),
    moduleTypography(facts, ctx),
    moduleFrontMatterText(facts, ctx),
    moduleArticles(facts, ctx),
    moduleEditorialText(facts),
    moduleImages(facts),
    moduleCrossVerification(facts, ctx),
  ];
}

// Deterministic checks over the (separate) cover spread PDF. The cover is
// reviewed alongside the binder but never merged into it — it is printed on
// different stock. Exported for unit tests; called by the orchestrator when a
// COVER file exists.
export function auditCoverPdf(facts: PdfFacts, ctx: PdfAuditContext): AuditModule {
  const items: AuditItem[] = [];
  const { draft, journal } = ctx;

  items.push(
    facts.pageCount >= 1 && facts.pageCount <= 2
      ? item("Cover pages", "pass", "1 page (wraparound spread) or 2 (front + back)", `${facts.pageCount} page(s).`)
      : item("Cover pages", "warn", "1 page (wraparound spread) or 2 (front + back)", `${facts.pageCount} pages — expected 1 or 2.`),
  );

  // Accept a single A4 page (front-only) or the wraparound spread. The spread
  // trim matches the dashboard's cover export: page width × 2 + spine
  // (defaults 210 × 2 + 12 = 432 mm wide × 297 mm tall).
  const pageW = draft.coverPageWidthMm ?? 210;
  const spineW = draft.spineMm ?? 12;
  const spreadW = pageW * 2 + spineW;
  const spreadH = draft.coverPageHeightMm ?? 297;
  const sizeOk = facts.pages.every((p) => {
    const w = mmOf(p.widthPt);
    const h = mmOf(p.heightPt);
    const isA4 = Math.abs(w - 210) <= 3 && Math.abs(h - 297) <= 3;
    const isSpread = Math.abs(w - spreadW) <= 4 && Math.abs(h - spreadH) <= 4;
    return isA4 || isSpread;
  });
  const first = facts.pages[0];
  items.push(
    sizeOk
      ? item("Cover trim size", "pass", `A4 or ${spreadW} × ${spreadH} mm spread`, `Measured ${mmOf(first.widthPt).toFixed(0)} × ${mmOf(first.heightPt).toFixed(0)} mm.`)
      : item(
          "Cover trim size",
          "warn",
          `A4 or ${spreadW} × ${spreadH} mm spread`,
          `Measured ${mmOf(first.widthPt).toFixed(0)} × ${mmOf(first.heightPt).toFixed(0)} mm — neither A4 nor the expected spread. If the PDF still carries bleed/crop marks, export a trim-only cover.`,
        ),
  );

  const text = facts.pages.map((p) => p.text).join(" ");
  const rasterized = text.length < 20;
  const expect = (label: string, value: string) => {
    const v = plain(value);
    if (!v) {
      items.push(item(label, "warn", "Present on the cover", "No reference value set on the journal/draft."));
      return;
    }
    if (rasterized) {
      items.push(item(label, "manual", "Present on the cover", `Expected “${v}” — cover is image-based, checked by AI review.`));
      return;
    }
    items.push(
      fuzzyIncludes(text, v)
        ? item(label, "pass", "Present on the cover", `Found “${v}”.`)
        : item(label, "fail", "Present on the cover", `“${v}” not found in the cover text.`),
    );
  };
  expect("Journal title", draft.journalTitle || journal.name);
  expect("Volume", draft.issueVolume ? `Volume ${draft.issueVolume}` : "");
  expect("Issue", draft.issueNumber ? `Issue ${draft.issueNumber}` : "");
  expect("Month & Year", [draft.issueMonthRange, draft.issueYear].filter(Boolean).join(" "));

  const issns = Array.from(new Set(text.match(ISSN_SCAN_RE) ?? []));
  if (rasterized) {
    items.push(item("ISSNs on cover", "manual", "Print & Online ISSN visible", "Cover is image-based — checked by AI review."));
  } else if (issns.length === 0) {
    items.push(item("ISSNs on cover", "warn", "Print & Online ISSN visible", "No ISSN-shaped string found in the cover text."));
  } else {
    const invalid = issns.filter((s) => !isValidIssn(s));
    items.push(
      invalid.length
        ? item("ISSNs on cover", "fail", "Print & Online ISSN visible and valid", `Invalid ISSN checksum: ${invalid.join(", ")}.`)
        : item("ISSNs on cover", "pass", "Print & Online ISSN visible and valid", `Found: ${issns.join(", ")}.`),
    );
  }

  return {
    id: "pdf-cover",
    title: "PDF · Modules 2/13 — Cover spread",
    note: rasterized ? "Cover pages are image-based — visual verification is handled by the AI review." : undefined,
    items,
  };
}

function moduleGeometry(facts: PdfFacts): AuditModule {
  const items: AuditItem[] = [];

  const offSize = facts.pages.filter(
    (p) => Math.abs(mmOf(p.widthPt) - 210) > 2 || Math.abs(mmOf(p.heightPt) - 297) > 2,
  );
  items.push(
    offSize.length === 0
      ? item("Page size", "pass", "A4 (210 × 297 mm)", `All ${facts.pageCount} pages are A4.`)
      : item(
          "Page size",
          "fail",
          "A4 (210 × 297 mm)",
          `${offSize.length} page(s) are not A4 — e.g. page ${offSize[0].pageNumber} is ${mmOf(offSize[0].widthPt).toFixed(0)} × ${mmOf(offSize[0].heightPt).toFixed(0)} mm.`,
        ),
  );

  const landscape = facts.pages.filter((p) => p.widthPt > p.heightPt);
  items.push(
    landscape.length === 0
      ? item("Orientation", "pass", "Portrait", "All pages are portrait.")
      : item("Orientation", "fail", "Portrait", `${landscape.length} landscape page(s): ${landscape.slice(0, 5).map((p) => p.pageNumber).join(", ")}.`),
  );

  items.push(
    facts.pageCount % 2 === 0
      ? item("Total binder pages", "pass", "Even number", `${facts.pageCount} pages (even).`)
      : item("Total binder pages", "fail", "Even number", `${facts.pageCount} pages — odd; add or remove a page (e.g. a blank verso).`),
  );

  // Margins are measured from the text bounding box, which includes running
  // headers/footers — deviations are warned, not failed.
  const textPages = facts.pages.filter((p) => p.items.length > 3);
  if (textPages.length) {
    const margins = textPages.map((p) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const it of p.items) {
        if (!it.text.trim()) continue;
        minX = Math.min(minX, it.x);
        maxX = Math.max(maxX, it.x + it.width);
        minY = Math.min(minY, it.y);
        maxY = Math.max(maxY, it.y + it.height);
      }
      return {
        top: (p.heightPt - maxY) / PT_PER_IN,
        bottom: minY / PT_PER_IN,
        left: minX / PT_PER_IN,
        right: (p.widthPt - maxX) / PT_PER_IN,
      };
    });
    const median = (vals: number[]) => vals.slice().sort((a, b) => a - b)[Math.floor(vals.length / 2)];
    const top = median(margins.map((m) => m.top));
    const bottom = median(margins.map((m) => m.bottom));
    const left = median(margins.map((m) => m.left));
    const right = median(margins.map((m) => m.right));
    const fmt = (v: number) => `${v.toFixed(2)}″`;
    const ok = top >= 0.4 && bottom >= 0.4 && left >= 0.5 && right >= 0.4;
    items.push(
      item(
        "Margins (from text bounding box)",
        ok ? "pass" : "warn",
        "Top 0.75–1.0″ · Bottom 0.75″ · Inside 1.0″ · Outside 0.75″ (headers/footers sit inside these)",
        `Median measured — top ${fmt(top)}, bottom ${fmt(bottom)}, left ${fmt(left)}, right ${fmt(right)}. Header/footer text reduces the measured top/bottom values below the body margins.`,
      ),
    );
  } else {
    items.push(item("Margins", "manual", "Standard A4 margins", "No extractable text — margins are verified in the AI review."));
  }

  return {
    id: "pdf-geometry",
    title: "PDF · Module 1 — Page geometry",
    note: "Measured from the assembled binder PDF.",
    items,
  };
}

function moduleTypography(facts: PdfFacts, ctx: PdfAuditContext): AuditModule {
  const items: AuditItem[] = [];
  const articlePages = articlePageFacts(facts, ctx);
  const textPages = (articlePages.length ? articlePages : facts.pages).filter((p) => p.text.length > 100);

  if (!textPages.length) {
    return {
      id: "pdf-typography",
      title: "PDF · Module 1/10 — Typography",
      items: [item("Fonts & sizes", "manual", "Times New Roman body 11–13 pt", "No extractable text (rasterized pages) — typography is verified in the AI review.")],
    };
  }

  const hasTimes = facts.fonts.some((f) => /times/i.test(f));
  items.push(
    hasTimes
      ? item("Body font", "pass", "Times New Roman", `Times face found. Fonts used: ${facts.fonts.slice(0, 6).join(", ")}${facts.fonts.length > 6 ? "…" : ""}.`)
      : item("Body font", "warn", "Times New Roman", `No Times face detected. Fonts used: ${facts.fonts.slice(0, 8).join(", ")}.`),
  );

  const bodySizes = textPages
    .map((p) => dominantFontSize(p.items))
    .filter((s): s is number => s != null);
  if (bodySizes.length) {
    const median = bodySizes.slice().sort((a, b) => a - b)[Math.floor(bodySizes.length / 2)];
    const ok = median >= 10.5 && median <= 13.5;
    items.push(
      item(
        "Body font size",
        ok ? "pass" : "warn",
        "11–13 pt",
        `Dominant body size ≈ ${median} pt (median across ${bodySizes.length} text page(s)).`,
      ),
    );
  }

  // Running header: topmost text line on article pages after the first.
  const headerPages = articlePages.filter((p, idx) => idx > 0 && p.items.length > 3);
  if (headerPages.length) {
    const headerSizes: number[] = [];
    for (const p of headerPages) {
      const topBand = p.items.filter((it) => it.text.trim() && it.y > p.heightPt - 60);
      const size = dominantFontSize(topBand);
      if (size != null) headerSizes.push(size);
    }
    if (headerSizes.length) {
      const median = headerSizes.slice().sort((a, b) => a - b)[Math.floor(headerSizes.length / 2)];
      const ok = median >= 8.5 && median <= 11;
      items.push(item("Running header font size", ok ? "pass" : "warn", "10 pt", `Dominant header size ≈ ${median} pt.`));
    }
  }

  return { id: "pdf-typography", title: "PDF · Module 1/10 — Typography", items };
}

/** Pages belonging to articles (per assembly meta); [] when unknown. */
function articlePageFacts(facts: PdfFacts, ctx: PdfAuditContext): PdfPageFacts[] {
  if (!ctx.assembly) return [];
  const first = ctx.assembly.frontMatterPages + 1;
  return facts.pages.filter((p) => p.pageNumber >= first);
}

function moduleFrontMatterText(facts: PdfFacts, ctx: PdfAuditContext): AuditModule {
  const { journal, draft, assembly } = ctx;
  const fmPages = assembly ? facts.pages.slice(0, assembly.frontMatterPages) : facts.pages.slice(0, 8);
  const fmText = fmPages.map((p) => p.text).join(" ");
  const rasterized = fmPages.length > 0 && fmPages.every((p) => p.imageOnly || p.text.length < 20);

  const note = rasterized
    ? "Front-matter pages are image-based (rasterized export) — text metadata is verified visually by the AI review."
    : undefined;

  const items: AuditItem[] = [];
  const check = (label: string, value: string, required = true) => {
    const v = plain(value);
    if (!v) {
      items.push(item(label, required ? "warn" : "na", "Present on the front matter", "No reference value set on the journal/draft."));
      return;
    }
    if (rasterized) {
      items.push(item(label, "manual", "Present on the front matter", `Expected “${v}” — page is image-based, checked by AI review.`));
      return;
    }
    items.push(
      fuzzyIncludes(fmText, v)
        ? item(label, "pass", "Present on the front matter", `Found “${v}”.`)
        : item(label, "fail", "Present on the front matter", `“${v}” not found in the front-matter text.`),
    );
  };

  check("Journal title", draft.journalTitle || journal.name);
  check("Journal abbreviation", draft.journalAbbreviation || journal.abbreviation);
  check("Volume", draft.issueVolume ? `Volume ${draft.issueVolume}` : "");
  check("Issue", draft.issueNumber ? `Issue ${draft.issueNumber}` : "");
  check("Month & Year", [draft.issueMonthRange, draft.issueYear].filter(Boolean).join(" "));

  // ISSNs on the FRONT MATTER only — article reference lists legitimately cite
  // other journals' ISSNs (possibly mistyped by authors); those must not fail
  // the publisher's own ISSN check.
  const issnMatches = Array.from(new Set(fmText.match(ISSN_SCAN_RE) ?? []));
  if (rasterized) {
    items.push(item("ISSNs printed", "manual", "Print & Online ISSN present and valid", "Image-based pages — checked by AI review."));
  } else if (issnMatches.length === 0) {
    items.push(item("ISSNs printed", "fail", "Print & Online ISSN present and valid", "No ISSN-shaped string found in the front-matter text."));
  } else {
    const invalid = issnMatches.filter((s) => !isValidIssn(s));
    items.push(
      invalid.length
        ? item("ISSNs printed", "fail", "Print & Online ISSN present and valid", `Invalid ISSN checksum: ${invalid.join(", ")}.`)
        : item("ISSNs printed", "pass", "Print & Online ISSN present and valid", `Found ${issnMatches.length} valid ISSN(s): ${issnMatches.join(", ")}.`),
    );
  }

  return { id: "pdf-front-matter", title: "PDF · Modules 2–4 — Front matter", note, items };
}

function moduleArticles(facts: PdfFacts, ctx: PdfAuditContext): AuditModule {
  const items: AuditItem[] = [];
  const assembly = ctx.assembly;
  if (!assembly || assembly.articles.length === 0) {
    return {
      id: "pdf-articles",
      title: "PDF · Module 10 — Articles",
      items: [item("Article checks", "manual", "Per-article first-page metadata", "No assembly map available — assemble the binder from per-article manuscripts to enable these checks.")],
    };
  }

  let titleHits = 0;
  let authorHits = 0;
  const titleMisses: string[] = [];
  let textArticles = 0;
  for (const article of assembly.articles) {
    const firstPage = facts.pages[article.startPage - 1];
    if (!firstPage || firstPage.text.length < 20) continue;
    textArticles += 1;
    if (fuzzyIncludes(firstPage.text, plain(article.title))) titleHits += 1;
    else titleMisses.push(article.title);
    if (article.authors && fuzzyIncludes(firstPage.text, plain(article.authors))) authorHits += 1;
  }

  if (textArticles === 0) {
    items.push(item("Article first pages", "manual", "Title/authors on each first page", "Article pages carry no extractable text — checked by AI review."));
  } else {
    items.push(
      titleMisses.length === 0
        ? item("Article titles on first pages", "pass", "TOC title appears on the article's first page", `${titleHits}/${textArticles} matched.`)
        : item(
            "Article titles on first pages",
            "fail",
            "TOC title appears on the article's first page",
            `${titleMisses.length} article(s) whose first page does not contain the TOC title: ${titleMisses.slice(0, 2).map((t) => `“${t}”`).join(", ")}${titleMisses.length > 2 ? "…" : ""}.`,
          ),
    );
    items.push(
      item(
        "Author names on first pages",
        authorHits === textArticles ? "pass" : "warn",
        "TOC authors appear on the article's first page",
        `${authorHits}/${textArticles} matched.`,
      ),
    );
  }

  // DOI shape: 10.<prefix>/<suffix> — validated against the journal's prefix when set.
  const articleText = articlePageFacts(facts, ctx).map((p) => p.text).join(" ");
  const dois = Array.from(new Set(articleText.match(/\b10\.\d{4,9}\/[^\s"<>]+/g) ?? []));
  const prefix = plain(ctx.journal.doi).match(/10\.\d{4,9}/)?.[0];
  if (dois.length === 0) {
    items.push(item("DOIs present", articleText.length > 100 ? "warn" : "manual", "DOI on each article", "No DOI-shaped string found in the article text."));
  } else {
    const wrongPrefix = prefix ? dois.filter((d) => !d.startsWith(prefix)) : [];
    items.push(
      wrongPrefix.length
        ? item("DOIs present", "fail", `DOI with journal prefix ${prefix}`, `${wrongPrefix.length} DOI(s) with a different prefix: ${wrongPrefix.slice(0, 3).join(", ")}.`)
        : item("DOIs present", "pass", prefix ? `DOI with journal prefix ${prefix}` : "DOI on each article", `Found ${dois.length} DOI(s).`),
    );
  }

  // Received / revised / accepted dates.
  if (articleText.length > 100) {
    const hasDates = /received/i.test(articleText) && /accepted/i.test(articleText);
    items.push(
      hasDates
        ? item("Received / Accepted dates", "pass", "Article history dates present", "Received/Accepted markers found.")
        : item("Received / Accepted dates", "warn", "Article history dates present", "No Received/Accepted markers found in the article text."),
    );
  }

  return { id: "pdf-articles", title: "PDF · Module 10 — Articles", items };
}

// Junk markers that are ordinary words in running prose ("…results highlight
// the need…", "a placeholder value was used…"). On full manuscript text these
// are review-worthy, not hard failures — unlike xxxx/?????/AQ/mojibake, which
// never belong in a finished article. The draft audit (short editor-entered
// fields) keeps treating all of JUNK_PATTERNS as failures.
const PROSE_AMBIGUOUS_JUNK = new Set([
  "the word 'placeholder'",
  "TBD marker",
  "TODO marker",
  "highlight marker",
  "track-changes marker",
]);

function moduleEditorialText(facts: PdfFacts): AuditModule {
  const hardHits: string[] = [];
  const softHits: string[] = [];
  for (const page of facts.pages) {
    if (!page.text) continue;
    for (const { label, re } of JUNK_PATTERNS) {
      if (!re.test(page.text)) continue;
      (PROSE_AMBIGUOUS_JUNK.has(label) ? softHits : hardHits).push(`p.${page.pageNumber}: ${label}`);
    }
  }
  const textless = facts.pages.filter((p) => p.imageOnly).length;
  const items: AuditItem[] = [
    hardHits.length
      ? item(
          "No junk / placeholder / query text",
          "fail",
          "No xxxx, ?????, lorem ipsum, AQ, or mojibake markers",
          `${hardHits.length} hit(s): ${Array.from(new Set(hardHits)).slice(0, 6).join("; ")}${hardHits.length > 6 ? "…" : ""}.`,
        )
      : item(
          "No junk / placeholder / query text",
          "pass",
          "No xxxx, ?????, lorem ipsum, AQ, or mojibake markers",
          `Scanned ${facts.pageCount - textless} text page(s) — nothing detected.${textless ? ` ${textless} image-only page(s) are covered by the AI review.` : ""}`,
        ),
  ];
  if (softHits.length) {
    items.push(
      item(
        "Possible editorial leftovers",
        "warn",
        "No unresolved TODO/TBD/placeholder/highlight/track-changes notes",
        `${softHits.length} mention(s) that may be ordinary prose — confirm manually: ${Array.from(new Set(softHits)).slice(0, 6).join("; ")}${softHits.length > 6 ? "…" : ""}.`,
      ),
    );
  }
  return { id: "pdf-editorial", title: "PDF · Module 12 — Editorial validation (text)", items };
}

function moduleImages(facts: PdfFacts): AuditModule {
  const measured: Array<{ page: number; dpi: number }> = [];
  let unmeasured = 0;
  for (const page of facts.pages) {
    for (const img of page.images) {
      // Ignore tiny decorations (< 0.5 inch placed on either side).
      if (img.dpi == null) {
        unmeasured += 1;
        continue;
      }
      if ((img.placedWidthPt ?? 0) < 36 || (img.placedHeightPt ?? 0) < 36) continue;
      measured.push({ page: page.pageNumber, dpi: img.dpi });
    }
  }

  const items: AuditItem[] = [];
  if (!measured.length && !unmeasured) {
    items.push(item("Image resolution", "na", "≥ 300 dpi", "No images detected."));
  } else {
    const low = measured.filter((m) => m.dpi < 280); // small tolerance below 300
    items.push(
      low.length
        ? item(
            "Image resolution (≥300 dpi)",
            "warn",
            "Print-quality images (≥ 300 dpi)",
            `${low.length} of ${measured.length} placed image(s) below ~300 dpi — e.g. page ${low[0].page} at ${Math.round(low[0].dpi)} dpi.`,
          )
        : item(
            "Image resolution (≥300 dpi)",
            "pass",
            "Print-quality images (≥ 300 dpi)",
            `${measured.length} placed image(s) measured, all ≥ ~300 dpi.${unmeasured ? ` ${unmeasured} not measurable.` : ""}`,
          ),
    );
  }
  return { id: "pdf-images", title: "PDF · Module 12 — Images", items };
}

function moduleCrossVerification(facts: PdfFacts, ctx: PdfAuditContext): AuditModule {
  const items: AuditItem[] = [];
  const assembly = ctx.assembly;

  // TOC page numbers vs where articles actually start. The TOC page value is
  // the printed page number; printed numbering starts on the first article
  // page, so compare against (actual − frontMatterPages) as well as raw.
  if (assembly && assembly.articles.length) {
    const mismatches: string[] = [];
    let comparable = 0;
    for (const article of assembly.articles) {
      const toc = Number.parseInt(plain(article.tocStartPage), 10);
      if (!Number.isFinite(toc)) continue;
      comparable += 1;
      const actualPrinted = printedPageNumber(facts.pages[article.startPage - 1]);
      const relative = article.startPage - assembly.frontMatterPages;
      // The printed folio is authoritative when the footer is machine-readable;
      // the relative/absolute positions are only fallbacks for rasterized pages.
      const matches =
        actualPrinted != null
          ? toc === actualPrinted
          : toc === relative || toc === article.startPage;
      if (!matches) {
        mismatches.push(`“${article.title}” — TOC says p.${toc}, article starts at binder p.${article.startPage}${actualPrinted != null ? ` (printed ${actualPrinted})` : ""}`);
      }
    }
    if (comparable === 0) {
      items.push(item("TOC page numbers = article pages", "warn", "TOC start pages match the assembled PDF", "TOC rows have no numeric page values to compare."));
    } else {
      items.push(
        mismatches.length
          ? item("TOC page numbers = article pages", "fail", "TOC start pages match the assembled PDF", `${mismatches.length} mismatch(es): ${mismatches.slice(0, 2).join("; ")}${mismatches.length > 2 ? "…" : ""}.`)
          : item("TOC page numbers = article pages", "pass", "TOC start pages match the assembled PDF", `All ${comparable} comparable TOC row(s) match.`),
      );
    }
  } else {
    items.push(item("TOC page numbers = article pages", "manual", "TOC start pages match the assembled PDF", "No assembly map — assemble from per-article manuscripts to enable."));
  }

  // Printed page-number continuity across article pages.
  const articlePages = articlePageFacts(facts, ctx);
  const printed = articlePages
    .map((p) => ({ page: p.pageNumber, printed: printedPageNumber(p) }))
    .filter((x): x is { page: number; printed: number } => x.printed != null);
  if (printed.length >= 2) {
    const breaks: string[] = [];
    for (let i = 1; i < printed.length; i += 1) {
      const expected = printed[i - 1].printed + (printed[i].page - printed[i - 1].page);
      if (printed[i].printed !== expected) {
        breaks.push(`binder p.${printed[i].page} prints ${printed[i].printed}, expected ${expected}`);
      }
    }
    items.push(
      breaks.length
        ? item("Continuous page numbering", "fail", "Printed numbers increase continuously", `${breaks.length} discontinuity(ies): ${breaks.slice(0, 3).join("; ")}${breaks.length > 3 ? "…" : ""}.`)
        : item("Continuous page numbering", "pass", "Printed numbers increase continuously", `${printed.length} printed page numbers found, all continuous.`),
    );
  } else {
    items.push(
      item(
        "Continuous page numbering",
        articlePages.length ? "warn" : "manual",
        "Printed numbers increase continuously",
        articlePages.length ? "Fewer than two bottom-centre page numbers detected — confirm the footer carries the page number." : "No article pages identified.",
      ),
    );
  }

  // Consistency of volume / issue markers across article text pages.
  // Draft fields are user-entered — escape before building patterns, or a
  // volume like "12(" would throw and abort the whole QA run.
  const vol = escapeRe(plain(ctx.draft.issueVolume));
  const issue = escapeRe(plain(ctx.draft.issueNumber));
  const textArticlePages = articlePages.filter((p) => p.text.length > 100);
  if (vol && textArticlePages.length) {
    const missing = textArticlePages.filter((p) => !new RegExp(`volume\\s*${vol}\\b`, "i").test(p.text) && !new RegExp(`vol\\.?\\s*${vol}\\b`, "i").test(p.text));
    const share = missing.length / textArticlePages.length;
    items.push(
      share > 0.5
        ? item("Volume consistent in headers", "warn", `“Volume ${vol}” on article pages`, `${missing.length} of ${textArticlePages.length} text page(s) don't mention Volume ${vol}.`)
        : item("Volume consistent in headers", "pass", `“Volume ${vol}” on article pages`, `${textArticlePages.length - missing.length}/${textArticlePages.length} pages carry the volume marker.`),
    );
  }
  if (issue && textArticlePages.length) {
    const missing = textArticlePages.filter((p) => !new RegExp(`issue\\s*${issue}\\b`, "i").test(p.text));
    const share = missing.length / textArticlePages.length;
    items.push(
      share > 0.5
        ? item("Issue consistent in headers", "warn", `“Issue ${issue}” on article pages`, `${missing.length} of ${textArticlePages.length} text page(s) don't mention Issue ${issue}.`)
        : item("Issue consistent in headers", "pass", `“Issue ${issue}” on article pages`, `${textArticlePages.length - missing.length}/${textArticlePages.length} pages carry the issue marker.`),
    );
  }

  // "Published by STM Journals" requirement for International journals. The
  // checklist requires the imprint PHRASE — a bare "STM Journals" mention
  // (copyright line, URL) is not sufficient and only rates a warn.
  const isInternational = /international/i.test(ctx.journal.type ?? "");
  if (isInternational) {
    const allText = facts.pages.map((p) => p.text).join(" ");
    const strictPhrase = /published\s+by\s+stm\s+journals/i.test(allText);
    const looseMention = /stm\s+journals/i.test(allText);
    const anyText = allText.length > 100;
    items.push(
      !anyText
        ? item('"Published by STM Journals"', "manual", "Required for International journals", "No extractable text — checked by AI review.")
        : strictPhrase
          ? item('"Published by STM Journals"', "pass", "Required for International journals", "Imprint phrase found in the binder text.")
          : looseMention
            ? item('"Published by STM Journals"', "warn", "Required for International journals", '"STM Journals" is mentioned, but the exact phrase "Published by STM Journals" was not found — confirm the imprint line.')
            : item('"Published by STM Journals"', "fail", "Required for International journals", "Not found anywhere in the binder text."),
    );
  }

  return { id: "pdf-cross", title: "PDF · Module 14 — Cross verification", items };
}
