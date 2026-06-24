// Lightweight inline rich text for scientific content (italics, sub/superscript,
// Greek letters & symbols). Values are stored as a *constrained* HTML string:
//
//   - The ONLY tags ever allowed are <em>, <strong>, <sub>, <sup>.
//   - No attributes are ever emitted, so there is no vector for event handlers,
//     `style`, `javascript:` URLs, etc.
//   - Greek letters and symbols (α, β, ±, ×, …) are plain Unicode text.
//   - Newlines are preserved as "\n" so existing line-based fields that do
//     `value.split("\n")` keep working; each line may carry inline formatting.
//
// Anything outside the allowlist is escaped to text, so legacy plain strings
// (and any hostile input) render literally and safely.

const ALLOWED_TAGS = new Set(["em", "strong", "sub", "sup"]);

// contentEditable / pasted markup uses these legacy aliases — normalize them.
const TAG_ALIASES: Record<string, string> = { i: "em", b: "strong" };

// An "&" already starting a valid HTML entity is left alone, so re-sanitizing an
// already-sanitized value is idempotent (e.g. a stored title "A &amp; B" stays
// "A &amp; B" instead of becoming "A &amp;amp; B", which renders as "A &amp; B").
const BARE_AMP_RE = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;

/** Escape a run of plain text for safe HTML output (idempotent for entities). */
export function escapeHtmlText(text: string): string {
  return text
    .replace(BARE_AMP_RE, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Matches a single start/end tag. The tag name must follow "<" (or "</")
// immediately, exactly like real HTML parsing — "< b" is text, not a tag. We
// deliberately tolerate (and then discard) any attributes: `[^>]*` swallows
// them, and we never copy them to the output.
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;

/**
 * Reduce an arbitrary string to the constrained inline-HTML subset. Keeps only
 * <em>/<strong>/<sub>/<sup> (normalizing <i>/<b>), strips every attribute, and
 * escapes all other markup to text. Newlines are passed through unchanged.
 */
export function sanitizeInlineHtml(input: string | null | undefined): string {
  if (!input) return "";
  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(input)) !== null) {
    out += escapeHtmlText(input.slice(last, match.index));
    const isClose = match[1] === "/";
    const raw = match[2].toLowerCase();
    const name = TAG_ALIASES[raw] ?? raw;
    if (ALLOWED_TAGS.has(name)) {
      out += isClose ? `</${name}>` : `<${name}>`;
    } else {
      // Unknown tag (script, div, img, …): emit it as visible, inert text.
      out += escapeHtmlText(match[0]);
    }
    last = TAG_RE.lastIndex;
  }
  out += escapeHtmlText(input.slice(last));
  return out;
}

/**
 * Sanitize and prepare a value for `dangerouslySetInnerHTML`, turning newlines
 * into <br> so multi-line content renders with its line breaks intact.
 */
export function renderInlineHtml(input: string | null | undefined): string {
  return sanitizeInlineHtml(input).replace(/\r?\n/g, "<br>");
}

/**
 * Convert a stored value into markup for seeding a contentEditable editor:
 * sanitized inline tags plus <br> for newlines.
 */
export function valueToEditableHtml(input: string | null | undefined): string {
  return renderInlineHtml(input);
}

/** True when the value contains any inline formatting tag (after sanitizing). */
export function hasInlineFormatting(input: string | null | undefined): boolean {
  return /<(em|strong|sub|sup)>/.test(sanitizeInlineHtml(input));
}

/** Strip all formatting to plain text (e.g. for length checks or exports). */
export function inlineToPlainText(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeInlineHtml(input)
    .replace(/<\/?(?:em|strong|sub|sup)>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
