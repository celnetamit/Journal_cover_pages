"use server";

import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv";
import { requireRole } from "@/lib/auth/session";
import { ENTITY_SPECS, type EntityKey } from "@/lib/entity-csv";

export type ImportState = { ok?: boolean; message?: string; error?: string } | undefined;

// Upsert rows from an uploaded CSV. Bound per entity + list path in the page.
export async function importCsv(
  entity: EntityKey,
  basePath: string,
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireRole("EDITOR");
  const spec = ENTITY_SPECS[entity];
  if (!spec) return { error: "Unknown entity." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file to import." };
  if (file.size > 10 * 1024 * 1024) return { error: "File too large (max 10 MB)." };

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { error: "Could not read the file." };
  }

  const parsed = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (parsed.length < 2) return { error: "CSV has a header but no data rows." };

  const headers = parsed[0].map((h) => h.trim());
  const records = parsed.slice(1).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])));

  let summary;
  try {
    summary = await spec.importRecords(records);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Import failed." };
  }

  revalidatePath(basePath);
  revalidatePath("/");

  const parts = [`${summary.created} created`, `${summary.updated} updated`];
  if (summary.skipped) parts.push(`${summary.skipped} skipped`);
  let message = parts.join(", ") + ".";
  if (summary.errors.length) {
    message += ` ${summary.errors.length} warning(s): ${summary.errors.slice(0, 5).join("; ")}`;
    if (summary.errors.length > 5) message += " …";
  }
  return { ok: true, message };
}
