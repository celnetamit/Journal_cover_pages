import { describe, it, expect } from "vitest";
import {
  sanitizeInlineHtml,
  renderInlineHtml,
  inlineToPlainText,
  hasInlineFormatting,
} from "@/lib/rich-text";

describe("sanitizeInlineHtml", () => {
  it("passes plain text through unchanged", () => {
    expect(sanitizeInlineHtml("Synthesis at 25 °C with β-cyclodextrin")).toBe(
      "Synthesis at 25 °C with β-cyclodextrin",
    );
  });

  it("keeps the allowed inline tags", () => {
    expect(sanitizeInlineHtml("H<sub>2</sub>O and x<sup>2</sup>")).toBe(
      "H<sub>2</sub>O and x<sup>2</sup>",
    );
    expect(sanitizeInlineHtml("<em>italic</em> <strong>bold</strong>")).toBe(
      "<em>italic</em> <strong>bold</strong>",
    );
  });

  it("normalizes <i>/<b> aliases", () => {
    expect(sanitizeInlineHtml("<i>x</i> <b>y</b>")).toBe(
      "<em>x</em> <strong>y</strong>",
    );
  });

  it("strips all attributes from allowed tags", () => {
    expect(sanitizeInlineHtml('<sub class="x" onclick="evil()">2</sub>')).toBe(
      "<sub>2</sub>",
    );
    expect(sanitizeInlineHtml('<em style="color:red" title="hi">text</em>')).toBe(
      "<em>text</em>",
    );
  });

  it("escapes disallowed tags to inert text", () => {
    expect(sanitizeInlineHtml("<div>x</div>")).toBe("&lt;div&gt;x&lt;/div&gt;");
    expect(sanitizeInlineHtml("<p>x</p>")).toBe("&lt;p&gt;x&lt;/p&gt;");
  });

  it("neutralizes script / img / event-handler XSS attempts", () => {
    expect(sanitizeInlineHtml('<script>alert(1)</script>')).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(sanitizeInlineHtml('<img src=x onerror=alert(1)>')).toBe(
      "&lt;img src=x onerror=alert(1)&gt;",
    );
    expect(sanitizeInlineHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '&lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;'.replace(
        /&quot;/g,
        '"',
      ),
    );
    // No executable markup survives.
    expect(sanitizeInlineHtml('<img src=x onerror=alert(1)>')).not.toContain("<img");
  });

  it("escapes stray angle brackets and ampersands", () => {
    expect(sanitizeInlineHtml("a < b && c > d")).toBe("a &lt; b &amp;&amp; c &gt; d");
  });

  it("preserves newlines", () => {
    expect(sanitizeInlineHtml("line1\nline2")).toBe("line1\nline2");
  });

  it("handles empty / nullish input", () => {
    expect(sanitizeInlineHtml("")).toBe("");
    expect(sanitizeInlineHtml(null)).toBe("");
    expect(sanitizeInlineHtml(undefined)).toBe("");
  });
});

describe("renderInlineHtml", () => {
  it("converts newlines to <br> after sanitizing", () => {
    expect(renderInlineHtml("a\nb")).toBe("a<br>b");
    expect(renderInlineHtml("<sub>2</sub>\n<div>x</div>")).toBe(
      "<sub>2</sub><br>&lt;div&gt;x&lt;/div&gt;",
    );
  });
});

describe("inlineToPlainText", () => {
  it("strips formatting and decodes entities", () => {
    expect(inlineToPlainText("H<sub>2</sub>O")).toBe("H2O");
    expect(inlineToPlainText("a < b")).toBe("a < b");
  });
});

describe("hasInlineFormatting", () => {
  it("detects formatting tags", () => {
    expect(hasInlineFormatting("H<sub>2</sub>O")).toBe(true);
    expect(hasInlineFormatting("plain text")).toBe(false);
    expect(hasInlineFormatting("<div>x</div>")).toBe(false);
  });
});
