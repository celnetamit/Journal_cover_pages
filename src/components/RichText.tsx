import type { CSSProperties, ElementType } from "react";
import { renderInlineHtml } from "@/lib/rich-text";

/**
 * Render a stored rich-text value (constrained inline HTML: <em>/<strong>/<sub>/
 * <sup> plus Unicode symbols). The value is always re-sanitized here, so it is
 * safe to render values coming from the database or user input. Newlines become
 * <br>. Works in both server and client components.
 *
 * Use anywhere a plain `{value}` text node was previously rendered.
 */
export function RichText({
  value,
  as,
  className,
  title,
  style,
}: {
  value: string | null | undefined;
  as?: ElementType;
  className?: string;
  title?: string;
  style?: CSSProperties;
}) {
  const Tag = as ?? "span";
  return (
    <Tag
      className={className}
      title={title}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderInlineHtml(value) }}
    />
  );
}

/** True when a value carries real, non-empty content (after trimming). */
export function hasValue(value: string | null | undefined): boolean {
  return !!(value && value.trim());
}

/**
 * Inline "missing data" flag rendered into the binder page itself, so it shows
 * in the editor preview AND the exported PDF — an incomplete binder can't be
 * shipped silently. Used for REQUIRED fields. The optional ISSN/SJIF/ICV trio
 * renders blank instead and is surfaced only as an editor-side hint.
 */
export function MissingFlag({ label, block = false }: { label: string; block?: boolean }) {
  return (
    <span className={block ? "binder-missing binder-missing-block" : "binder-missing"} role="alert">
      ⚠ {label} — set in Setup
    </span>
  );
}

/** Render a required rich-text value, or a missing-flag when it is blank. */
export function ReqText({
  value,
  label,
  as,
  className,
  style,
}: {
  value?: string | null;
  label: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  if (hasValue(value)) return <RichText as={as} className={className} style={style} value={value} />;
  return <MissingFlag label={label} />;
}
