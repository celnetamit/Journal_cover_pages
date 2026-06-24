import type { Journal } from "@/lib/journals";

const romanNumerals = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Month-range presets for the cover dropdown, derived by splitting the year
// evenly across the journal's issues-per-year (e.g. 3 → Jan–Apr, May–Aug,
// Sep–Dec; 2 → Jan–Jun, Jul–Dec). Returns [] when 12 isn't evenly divisible.
export function monthRangePresets(issuesPerYear: number | string | null | undefined): string[] {
  const n = Number(issuesPerYear);
  if (!Number.isInteger(n) || n < 1 || n > 12 || 12 % n !== 0) return [];
  const span = 12 / n;
  return Array.from({ length: n }, (_, i) => {
    const start = i * span;
    const end = start + span - 1;
    return span === 1 ? MONTHS[start] : `${MONTHS[start]} - ${MONTHS[end]}`;
  });
}

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
