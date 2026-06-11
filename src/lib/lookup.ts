import type { Journal } from "@/lib/journals";

export function dynamicKey(value: string | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function journalLookupKeys(journal: Journal) {
  return [
    dynamicKey(journal.abbreviation),
    dynamicKey(journal.shortName),
    dynamicKey(journal.name),
    dynamicKey(journal.id),
  ].filter(Boolean);
}
