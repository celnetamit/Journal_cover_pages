import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import type { Journal } from "@/lib/journals";
import type { BinderDraft } from "@/lib/binder-content";
import type { AuditModule } from "@/lib/binder-audit";
import { inlineToPlainText } from "@/lib/rich-text";
import type { AssemblyMeta } from "@/lib/binder-files";

// AI review layer of the binder QA run. Sends the assembled binder PDF to
// Claude (text + page images) with the issue's reference metadata and the
// checklist items that rules can't judge — logo presence, layout/alignment,
// image quality, photo uniformity, grammar, reference style — and gets back
// AuditModules in the exact shape the report UI already renders.
//
// Disabled gracefully: without ANTHROPIC_API_KEY the caller gets a single
// "manual" module explaining that AI review is off.

const MODEL = "claude-opus-4-8";
// Claude PDF input limits: 32 MB request / 600 pages. Documents are sent
// base64-encoded (×4/3), so the RAW byte budget must leave that headroom plus
// room for the prompt: 20 MB raw ≈ 26.7 MB encoded.
const MAX_RAW_DOC_BYTES = 20 * 1024 * 1024;
const MAX_REQUEST_PDF_PAGES = 550;
// Hard cap on AI requests per run (cost control). Pages beyond what fits are
// reported as not-AI-reviewed rather than silently skipped.
const MAX_CHUNKS = 8;

const StatusSchema = z.enum(["pass", "fail", "warn", "manual", "na"]);
const AiReportSchema = z.object({
  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          status: StatusSchema,
          requirement: z.string(),
          detail: z.string(),
        }),
      ),
    }),
  ),
});

export type AiAuditInput = {
  pdf: Uint8Array;
  pageCount: number;
  journal: Journal;
  draft: Partial<BinderDraft>;
  assembly: AssemblyMeta | null;
  /** Optional cover spread PDF — reviewed for the "ai-cover" module. */
  cover?: Uint8Array | null;
};

export type AiAuditResult =
  | { status: "ok"; modules: AuditModule[]; model: string }
  | { status: "skipped"; modules: AuditModule[]; reason: string }
  | { status: "error"; error: string };

export function aiReviewConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

const plain = (v: string | null | undefined) => inlineToPlainText(v ?? "").trim();

function metadataBlock(input: AiAuditInput): string {
  const { journal, draft, assembly } = input;
  const meta = {
    journalName: plain(draft.journalTitle) || plain(journal.name),
    abbreviation: plain(draft.journalAbbreviation) || plain(journal.abbreviation),
    volume: plain(draft.issueVolume),
    issue: plain(draft.issueNumber),
    monthYear: [plain(draft.issueMonthRange), plain(draft.issueYear)].filter(Boolean).join(" "),
    printIssn: plain(journal.pIssn),
    onlineIssn: plain(draft.eIssn) || plain(journal.eIssn),
    doiPrefix: plain(journal.doi),
    journalUrl: plain(draft.journalWebsite) || plain(journal.website),
    publisher: plain(journal.publisher) || "STM Journals",
    publicationType: plain(journal.type),
    frontMatterPages: assembly?.frontMatterPages ?? null,
    articles:
      assembly?.articles.map((a) => ({
        title: a.title,
        authors: a.authors,
        binderStartPage: a.startPage,
        binderEndPage: a.endPage,
        tocStartPage: a.tocStartPage,
      })) ?? [],
  };
  return JSON.stringify(meta, null, 2);
}

const SYSTEM_PROMPT = `You are a senior production QA reviewer for an academic journal publisher (STM Journals). You review assembled journal binder PDFs against the publisher's Journal Binder Quality Assurance checklist before they go to the internal review team.

You receive the binder PDF (you can see each page visually as well as its text) plus the issue's reference metadata. Judge ONLY the visual/semantic checks listed by the user — a separate rule-based engine already covers page geometry, ISSN checksums, junk-text scanning and TOC cross-verification, so do not duplicate those.

Be precise and evidence-based: every finding must name the page number(s) and what you saw. Use status values strictly:
- "pass": verified correct.
- "fail": clearly violates the requirement (blocks forwarding to review).
- "warn": suspicious or borderline — needs a human look but not clearly wrong.
- "manual": you could not assess it from the pages provided.
- "na": not applicable to this binder.
Do not invent findings; if a page looks fine, say so briefly. Prefer "warn" over "fail" when unsure.`;

function checklistPrompt(pageInfo: string): string {
  return `${pageInfo}

Review the attached binder pages against these checklist areas and return one module per area (use exactly these ids/titles):

1. id "ai-cover", title "AI · Front & back cover" — Cover page: STM Journals / publisher logo present; centre/journal logo present; cover design alignment; white space balance; typography quality; cover image quality (sharpness, no distortion); back cover completeness (publisher info, barcode/QR if present).
2. id "ai-people", title "AI · People pages" — Publication management team: photo present for each member, photos equal size, equal spacing, aligned grid, designation/department/email under each. Advisory & editorial board: complete-looking lists, consistent formatting/typography, no obviously duplicated members.
3. id "ai-design", title "AI · Layout & formatting" — Front-matter pages: formatting, alignment, margins look consistent; heading hierarchy; line spacing consistency. Article pages: consistent header/footer placement, footer copyright + bottom-centre page number, "source" captions under figures/tables where present.
4. id "ai-language", title "AI · Language & content" — Director's Desk / editorial: grammar and tone; no unresolved editorial notes, highlighting, or comment markers visible; no obviously missing images or broken layout anywhere.
5. id "ai-references", title "AI · References & citations" — Spot-check article reference lists: Vancouver numeric style; DOIs formatted consistently; figures and tables appear to be cited in the text near where they occur.

Reference metadata for this issue (verify the cover and headers against it):`;
}

async function slicePdf(src: PDFDocument, from: number, to: number): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
  const pages = await out.copyPages(src, indices);
  for (const p of pages) out.addPage(p);
  return out.save();
}

type ChunkPlan = {
  ranges: Array<{ from: number; to: number }>;
  /** Pages that could not be reviewed within the request budget, if any. */
  uncovered: { from: number; to: number } | null;
};

// Split an oversized binder into page ranges that respect BOTH the page cap
// and the raw-byte budget (estimated per page), snapping range ends back to
// the nearest article boundary where possible. Never exceeds MAX_CHUNKS
// requests — anything left over is reported as uncovered, not silently capped.
function chunkRanges(input: AiAuditInput): ChunkPlan {
  const { pageCount, assembly } = input;
  const within = input.pdf.byteLength <= MAX_RAW_DOC_BYTES && pageCount <= MAX_REQUEST_PDF_PAGES;
  if (within) return { ranges: [{ from: 1, to: pageCount }], uncovered: null };

  const bytesPerPage = Math.max(1, input.pdf.byteLength / Math.max(1, pageCount));
  const pagesByBytes = Math.max(1, Math.floor(MAX_RAW_DOC_BYTES / bytesPerPage));
  const targetPages = Math.max(1, Math.min(MAX_REQUEST_PDF_PAGES, pagesByBytes));

  const boundaries = assembly
    ? [assembly.frontMatterPages, ...assembly.articles.map((a) => a.endPage)]
    : [];
  const ranges: Array<{ from: number; to: number }> = [];
  let start = 1;
  while (start <= pageCount && ranges.length < MAX_CHUNKS) {
    let end = Math.min(start + targetPages - 1, pageCount);
    // Snap BACK to the last article boundary inside the budget (never forward,
    // which could blow the page/byte caps). Keep at least one page.
    const snap = boundaries.filter((b) => b >= start && b < end).sort((a, b) => b - a)[0];
    if (snap && end < pageCount) end = snap;
    ranges.push({ from: start, to: end });
    start = end + 1;
  }
  return {
    ranges,
    uncovered: start <= pageCount ? { from: start, to: pageCount } : null,
  };
}

// Zero-copy view over the underlying buffer — these payloads are tens of MB.
function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}

export async function runAiAudit(input: AiAuditInput): Promise<AiAuditResult> {
  if (!aiReviewConfigured()) {
    return {
      status: "skipped",
      reason: "ANTHROPIC_API_KEY is not configured",
      modules: [
        {
          id: "ai-review",
          title: "AI · Visual & semantic review",
          items: [
            {
              label: "AI review",
              status: "manual",
              requirement: "Logos, layout, image quality, people pages, grammar, references",
              detail:
                "AI review is not configured (ANTHROPIC_API_KEY is unset) — verify these checklist areas manually or configure the key and re-run.",
            },
          ],
        },
      ],
    };
  }

  const client = new Anthropic();
  const plan = chunkRanges(input);
  const ranges = plan.ranges;
  const metadata = metadataBlock(input);
  const merged = new Map<string, AuditModule>();
  // Loaded once and reused for every slice — parsing a 20 MB+ PDF per chunk
  // would multiply CPU and heap for the slowest runs.
  const srcDoc = ranges.length > 1 ? await PDFDocument.load(input.pdf, { ignoreEncryption: true }) : null;

  try {
    for (const range of ranges) {
      const whole = ranges.length === 1;
      const isFirst = range.from === 1;
      const pdfBytes = whole ? input.pdf : await slicePdf(srcDoc!, range.from, range.to);
      // The cover spread rides along with the first chunk only (and only while
      // the combined payload stays under the raw-byte budget).
      const includeCover =
        Boolean(input.cover?.length) &&
        isFirst &&
        pdfBytes.byteLength + (input.cover?.byteLength ?? 0) <= MAX_RAW_DOC_BYTES;
      let pageInfo = whole
        ? `The attached PDF is the complete assembled binder (${input.pageCount} pages).`
        : `The attached PDF contains binder pages ${range.from}–${range.to} of ${input.pageCount} (the binder was split to fit request limits — page numbers in your findings must refer to the ORIGINAL binder page numbers, i.e. attached page 1 is binder page ${range.from}). Mark checklist areas that fall outside these pages as "na".`;
      pageInfo += includeCover
        ? " A SECOND document is attached: the journal's cover spread (printed separately from the binder) — use it for the cover checks."
        : ' No separate cover PDF was provided — judge the cover checks from the binder\'s first/last pages if they carry the cover, otherwise mark them "manual".';

      const content: Anthropic.MessageParam["content"] = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: toBase64(pdfBytes) },
        },
      ];
      if (includeCover) {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: toBase64(input.cover!) },
        });
      }
      content.push({ type: "text", text: `${checklistPrompt(pageInfo)}\n${metadata}` });

      const response = await client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        output_config: { format: zodOutputFormat(AiReportSchema) },
        messages: [{ role: "user", content }],
      });

      const parsed = response.parsed_output;
      if (!parsed) {
        return { status: "error", error: `AI response could not be parsed (stop_reason: ${response.stop_reason}).` };
      }

      for (const mod of parsed.modules) {
        const existing = merged.get(mod.id);
        if (!existing) {
          merged.set(mod.id, { id: mod.id, title: mod.title, items: [...mod.items] });
        } else {
          mergeItems(existing, mod.items);
        }
      }
    }
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Claude API error ${err.status ?? ""}: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown AI review failure";
    console.error("AI binder review failed", err);
    return { status: "error", error: message };
  }

  const modules = Array.from(merged.values());
  if (!modules.length) return { status: "error", error: "AI review returned no modules." };

  // No silent caps: pages that didn't fit the request budget are surfaced as a
  // finding so the report never implies full coverage it didn't have.
  if (plan.uncovered) {
    modules.push({
      id: "ai-coverage",
      title: "AI · Review coverage",
      items: [
        {
          label: "Pages not AI-reviewed",
          status: "warn",
          requirement: "Every page visually reviewed",
          detail: `Binder pages ${plan.uncovered.from}–${plan.uncovered.to} exceeded the AI request budget and were not visually reviewed — check them manually (the rule-based checks still cover them).`,
        },
      ],
    });
  }
  return { status: "ok", modules, model: MODEL };
}

// Severity precedence for merging the same checklist item across chunks:
// the worst observed status wins; details are combined so page references
// from every chunk survive.
const STATUS_RANK: Record<AuditModule["items"][number]["status"], number> = {
  fail: 4,
  warn: 3,
  manual: 2,
  pass: 1,
  na: 0,
};

function mergeItems(target: AuditModule, incoming: AuditModule["items"]): void {
  for (const item of incoming) {
    const idx = target.items.findIndex((i) => i.label === item.label);
    if (idx === -1) {
      target.items.push(item);
      continue;
    }
    const current = target.items[idx];
    if (STATUS_RANK[item.status] > STATUS_RANK[current.status]) {
      target.items[idx] = {
        ...item,
        detail:
          current.status !== "na" && current.detail && item.detail && current.detail !== item.detail
            ? `${item.detail} (Other pages: ${current.detail})`
            : item.detail,
      };
    } else if (
      item.status === current.status &&
      item.detail &&
      current.detail &&
      item.detail !== current.detail &&
      item.status !== "na"
    ) {
      target.items[idx] = { ...current, detail: `${current.detail} ${item.detail}` };
    }
  }
}
