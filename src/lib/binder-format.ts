import type { Journal } from "@/lib/journals";

const romanNumerals = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function titleCaseName(name: string) {
  return name
    .replace(/^NOLEGEIN/i, "NOLEGEIN")
    .replace(/\b\w+/g, (word) =>
      word === "NOLEGEIN" ? word : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    );
}

export function isLawJournal(journal: Journal) {
  // Word-boundary match so "Flawless", "Lawn", etc. don't trigger law branding.
  return /\blaw\b/i.test(`${journal.publisher} ${journal.imprint} ${journal.domain}`);
}

export function compactKeyword(value: string) {
  return value
    .trim()
    .replace(/^[^a-z0-9]+/i, "")
    .split(/[\s,/()-]+/)
    .find(Boolean) || "";
}

export function lowerRoman(value: number) {
  return romanNumerals[value] || String(value).toLowerCase();
}

export function cleanIcv(value: string) {
  return value.replace(/^ICV\s*:\s*/i, "").trim();
}

export function frontCoverTitleClass(title: string) {
  const length = title.trim().length;
  if (length > 72) return "front-cover-title ultra-compact";
  if (length > 54) return "front-cover-title compact";
  if (length > 38) return "front-cover-title balanced";
  return "front-cover-title";
}
