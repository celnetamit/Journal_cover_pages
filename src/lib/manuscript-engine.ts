import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  defaultManuscriptEngine,
  type ManuscriptEngineSettings,
} from "@/lib/binder-content";

export const MANUSCRIPT_ENGINE_ID = "singleton";

// Shared Manuscript-page content. Each field falls back to the built-in default
// when the (single) DB row leaves it blank. Memoized per render pass.
export const getManuscriptEngine = cache(async (): Promise<ManuscriptEngineSettings> => {
  try {
    const row = await prisma.manuscriptEngine.findUnique({ where: { id: MANUSCRIPT_ENGINE_ID } });
    return {
      heading: row?.heading?.trim() || defaultManuscriptEngine.heading,
      leadText: row?.leadText?.trim() || defaultManuscriptEngine.leadText,
      steps: row?.steps.length ? row.steps : defaultManuscriptEngine.steps,
      scanLabel: row?.scanLabel?.trim() || defaultManuscriptEngine.scanLabel,
      logoUrl: row?.logoUrl?.trim() || defaultManuscriptEngine.logoUrl,
    };
  } catch {
    return defaultManuscriptEngine;
  }
});
