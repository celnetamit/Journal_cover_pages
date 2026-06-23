"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { escapeHtmlText, valueToEditableHtml } from "@/lib/rich-text";

// Character palette — Greek letters and the symbols scientific journals need.
const PALETTE: { label: string; chars: string[] }[] = [
  {
    label: "Greek (lower)",
    chars: "α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ ς τ υ φ χ ψ ω".split(" "),
  },
  {
    label: "Greek (upper)",
    chars: "Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω".split(" "),
  },
  {
    label: "Math & symbols",
    chars: "± × ÷ ° · ∙ ≤ ≥ ≠ ≈ ∝ ∞ √ ∑ ∏ ∫ ∂ ∇ ∆ µ ‰ ′ ″ ℃ ℉ Å → ← ↔ ⇌".split(" "),
  },
];

/** Convert the editor's live DOM into our constrained stored value. */
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtmlText(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = Array.from(el.childNodes).map(serializeNode).join("");
  switch (tag) {
    case "br":
      return "\n";
    case "em":
    case "i":
      return inner ? `<em>${inner}</em>` : "";
    case "strong":
    case "b":
      return inner ? `<strong>${inner}</strong>` : "";
    case "sub":
      return inner ? `<sub>${inner}</sub>` : "";
    case "sup":
      return inner ? `<sup>${inner}</sup>` : "";
    case "div":
    case "p":
    case "li":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      // Block elements mark a line boundary.
      return `\n${inner}`;
    default:
      return inner;
  }
}

function serializeEditor(root: HTMLElement, multiline: boolean): string {
  let value = Array.from(root.childNodes).map(serializeNode).join("");
  value = value
    .replace(/^\n+/, "") // no leading blank line from the first block wrapper
    .replace(/\n{3,}/g, "\n\n") // cap consecutive blanks
    .replace(/\s+$/g, ""); // trim trailing whitespace/newlines
  if (!multiline) value = value.replace(/\n+/g, " ").trim();
  return value;
}

type Props = {
  /** Controlled value (use with onChange). */
  value?: string;
  /** Initial value for uncontrolled / FormData usage. */
  defaultValue?: string;
  /** Called with the serialized value on every edit (controlled mode). */
  onChange?: (value: string) => void;
  /** Emits a hidden <input> carrying the serialized value for FormData submit. */
  name?: string;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  id?: string;
};

const editorBase =
  "rich-editor w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 whitespace-pre-wrap break-words";

export function RichTextField({
  value,
  defaultValue,
  onChange,
  name,
  multiline = false,
  rows = 3,
  placeholder,
  className,
  ariaLabel,
  id,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const initial = (isControlled ? value : defaultValue) ?? "";
  // Mirror of the last value we serialized out, so we don't clobber the caret
  // by re-seeding the DOM in response to our own edits.
  const lastEmitted = useRef<string>(initial);
  const [serialized, setSerialized] = useState<string>(initial);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Seed the editor once on mount.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = valueToEditableHtml(initial);
    }
    // Prefer semantic tags (<b>/<i>) over inline styles from execCommand.
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* not supported — fine, we normalize on serialize anyway */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-seed when a controlled value changes from the outside (not our own edit).
  useEffect(() => {
    if (!isControlled || !editorRef.current) return;
    if (value !== lastEmitted.current) {
      editorRef.current.innerHTML = valueToEditableHtml(value ?? "");
      lastEmitted.current = value ?? "";
      setSerialized(value ?? "");
    }
  }, [value, isControlled]);

  const emit = useCallback(() => {
    if (!editorRef.current) return;
    const next = serializeEditor(editorRef.current, multiline);
    lastEmitted.current = next;
    setSerialized(next);
    onChange?.(next);
  }, [multiline, onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      try {
        document.execCommand(command, false, arg);
      } catch {
        /* ignore unsupported command */
      }
      emit();
    },
    [emit],
  );

  const insertChar = useCallback(
    (char: string) => {
      exec("insertText", char);
    },
    [exec],
  );

  return (
    <div className={className}>
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <ToolButton label="Bold" onActivate={() => exec("bold")}>
          <span className="font-bold">B</span>
        </ToolButton>
        <ToolButton label="Italic" onActivate={() => exec("italic")}>
          <span className="italic font-serif">I</span>
        </ToolButton>
        <ToolButton label="Superscript" onActivate={() => exec("superscript")}>
          <span>
            x<sup>2</sup>
          </span>
        </ToolButton>
        <ToolButton label="Subscript" onActivate={() => exec("subscript")}>
          <span>
            x<sub>2</sub>
          </span>
        </ToolButton>
        <div className="relative">
          <ToolButton
            label="Insert symbol"
            active={paletteOpen}
            onActivate={() => setPaletteOpen((o) => !o)}
          >
            <span>Ω</span>
          </ToolButton>
          {paletteOpen && (
            <div className="absolute left-0 z-20 mt-1 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              {PALETTE.map((group) => (
                <div key={group.label} className="mb-2 last:mb-0">
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {group.chars.map((char) => (
                      <button
                        key={char}
                        type="button"
                        title={char}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertChar(char)}
                        className="h-7 w-7 rounded text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline={multiline}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => {
          emit();
          setPaletteOpen(false);
        }}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") e.preventDefault();
        }}
        className={editorBase}
        style={multiline ? { minHeight: `${rows * 1.5}rem` } : undefined}
      />

      {name && <input type="hidden" name={name} value={serialized} />}
    </div>
  );
}

function ToolButton({
  label,
  onActivate,
  active,
  children,
}: {
  label: string;
  onActivate: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      // Keep the editor selection: don't let the button take focus.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onActivate}
      className={`flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-xs ${
        active
          ? "border-slate-400 bg-slate-100 text-slate-900"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
