import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultAboutNotes } from "@/lib/binder-content";

export const ABOUT_NOTES_ID = "singleton";

// Shared About-page closing paragraphs. Falls back to the built-in defaults when
// the (single) DB row is missing or empty. Memoized per render pass.
export const getAboutNotes = cache(async (): Promise<string[]> => {
  try {
    const row = await prisma.aboutNotes.findUnique({ where: { id: ABOUT_NOTES_ID } });
    return row?.paragraphs.length ? row.paragraphs : defaultAboutNotes;
  } catch {
    return defaultAboutNotes;
  }
});
