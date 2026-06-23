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
