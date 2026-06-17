import "server-only";
import { prisma } from "@/lib/prisma";
import type { BinderDraft } from "@/lib/binder-content";

export type StoredDraft = {
  binderId: string;
  draft: BinderDraft;
  updatedAt: string;
  updatedByName: string | null;
};

export type BinderSummary = {
  id: string;
  volume: string | null;
  issue: string | null;
  year: number | null;
  type: string;
  monthRange: string | null;
  updatedAt: string;
  updatedByName: string | null;
};

export type SaveResult =
  | { status: "ok"; binderId: string; updatedAt: string; updatedByName: string | null }
  | { status: "conflict"; draft: BinderDraft; updatedAt: string; updatedByName: string | null }
  | { status: "error"; message: string };

const name = (u: { name: string | null; email: string | null } | null) => u?.name ?? u?.email ?? null;

// A binder is identified per issue. Drafts always carry these fields with
// defaults, so coerce to non-null strings/number to keep the composite unique
// key well-defined (Postgres treats NULLs as distinct).
function issueKey(draft: BinderDraft) {
  const year = Number.parseInt(draft.issueYear ?? "", 10);
  return {
    volume: (draft.issueVolume ?? "").trim(),
    issue: (draft.issueNumber ?? "").trim(),
    year: Number.isFinite(year) ? year : 0,
  };
}

function isUniqueError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// Load the most-recently-updated binder per journal as ready-to-use drafts.
export async function loadServerDrafts(): Promise<Record<string, StoredDraft>> {
  const binders = await prisma.binder.findMany({
    orderBy: { updatedAt: "desc" },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  const byJournal: Record<string, StoredDraft> = {};
  for (const b of binders) {
    if (byJournal[b.journalId] || !b.overrides) continue; // first seen wins (newest)
    byJournal[b.journalId] = {
      binderId: b.id,
      draft: b.overrides as unknown as BinderDraft,
      updatedAt: b.updatedAt.toISOString(),
      updatedByName: name(b.updatedBy),
    };
  }
  return byJournal;
}

// All issues (binders) of a journal, newest first.
export async function listBinders(journalId: string): Promise<BinderSummary[]> {
  const binders = await prisma.binder.findMany({
    where: { journalId },
    orderBy: { updatedAt: "desc" },
    include: { updatedBy: { select: { name: true, email: true } } },
  });
  return binders.map((b) => ({
    id: b.id,
    volume: b.volume,
    issue: b.issue,
    year: b.year,
    type: b.type,
    monthRange: b.monthRange,
    updatedAt: b.updatedAt.toISOString(),
    updatedByName: name(b.updatedBy),
  }));
}

export async function getBinderById(binderId: string): Promise<StoredDraft | null> {
  const b = await prisma.binder.findUnique({
    where: { id: binderId },
    include: { updatedBy: { select: { name: true, email: true } } },
  });
  if (!b || !b.overrides) return null;
  return {
    binderId: b.id,
    draft: b.overrides as unknown as BinderDraft,
    updatedAt: b.updatedAt.toISOString(),
    updatedByName: name(b.updatedBy),
  };
}

async function writeArticles(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  binderId: string,
  draft: BinderDraft,
) {
  await tx.article.deleteMany({ where: { binderId } });
  const rows = (draft.contentRows ?? []).filter((r) => r.title?.trim());
  if (rows.length) {
    await tx.article.createMany({
      data: rows.map((r, index) => ({
        binderId,
        title: r.title,
        authors: r.author || null,
        startPage: r.page || null,
        order: index,
      })),
    });
  }
}

// Save a draft. When `binderId` is given, that binder is updated in place
// (allowing its issue fields to change); otherwise a new binder is created from
// the draft's issue fields. Conflict-checked against `baseUpdatedAt`.
export async function saveBinder(
  journalId: string,
  draft: BinderDraft,
  baseUpdatedAt: string | undefined,
  binderId: string | undefined,
  userId: string,
): Promise<SaveResult> {
  const key = issueKey(draft);
  const data = {
    ...key,
    monthRange: draft.issueMonthRange ?? null,
    directorParagraphs: draft.directorParagraphs ?? [],
    overrides: draft as unknown as object,
    updatedById: userId,
  };

  const existing = binderId
    ? await prisma.binder.findUnique({ where: { id: binderId }, include: { updatedBy: { select: { name: true, email: true } } } })
    : null;

  // Updating an existing issue.
  if (existing) {
    if (existing.journalId !== journalId) return { status: "error", message: "Issue does not belong to this journal." };
    if (existing.updatedAt.toISOString() !== (baseUpdatedAt ?? null)) {
      return { status: "conflict", draft: existing.overrides as unknown as BinderDraft, updatedAt: existing.updatedAt.toISOString(), updatedByName: name(existing.updatedBy) };
    }
    try {
      const saved = await prisma.$transaction(async (tx) => {
        const b = await tx.binder.update({ where: { id: existing.id }, data, include: { updatedBy: { select: { name: true, email: true } } } });
        await writeArticles(tx, b.id, draft);
        return b;
      });
      return { status: "ok", binderId: saved.id, updatedAt: saved.updatedAt.toISOString(), updatedByName: name(saved.updatedBy) };
    } catch (e) {
      if (isUniqueError(e)) return { status: "error", message: "Another issue already uses that volume / issue / year." };
      throw e;
    }
  }

  // Creating a new issue. Guard against a duplicate issue key.
  const clash = await prisma.binder.findUnique({ where: { journalId_volume_issue_year: { journalId, ...key } } });
  if (clash) {
    return { status: "error", message: "That volume / issue / year already exists — open it from the issue list." };
  }
  try {
    const saved = await prisma.$transaction(async (tx) => {
      const b = await tx.binder.create({ data: { journalId, ...data }, include: { updatedBy: { select: { name: true, email: true } } } });
      await writeArticles(tx, b.id, draft);
      return b;
    });
    return { status: "ok", binderId: saved.id, updatedAt: saved.updatedAt.toISOString(), updatedByName: name(saved.updatedBy) };
  } catch (e) {
    if (isUniqueError(e)) return { status: "error", message: "That volume / issue / year already exists." };
    throw e;
  }
}

export async function deleteBinder(binderId: string): Promise<void> {
  await prisma.binder.delete({ where: { id: binderId } });
}
