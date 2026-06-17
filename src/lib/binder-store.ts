import "server-only";
import { prisma } from "@/lib/prisma";
import type { BinderDraft } from "@/lib/binder-content";

export type StoredDraft = {
  draft: BinderDraft;
  updatedAt: string;
  updatedByName: string | null;
};

export type SaveResult =
  | { status: "ok"; updatedAt: string; updatedByName: string | null }
  | { status: "conflict"; draft: BinderDraft; updatedAt: string; updatedByName: string | null };

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

// Load the most-recently-updated binder per journal as ready-to-use drafts.
export async function loadServerDrafts(): Promise<Record<string, StoredDraft>> {
  const binders = await prisma.binder.findMany({
    orderBy: { updatedAt: "desc" },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  const byJournal: Record<string, StoredDraft> = {};
  for (const b of binders) {
    // First seen wins because rows are ordered newest-first.
    if (byJournal[b.journalId]) continue;
    if (!b.overrides) continue;
    byJournal[b.journalId] = {
      draft: b.overrides as unknown as BinderDraft,
      updatedAt: b.updatedAt.toISOString(),
      updatedByName: b.updatedBy?.name ?? b.updatedBy?.email ?? null,
    };
  }
  return byJournal;
}

export async function getJournalDraft(journalId: string): Promise<StoredDraft | null> {
  const b = await prisma.binder.findFirst({
    where: { journalId },
    orderBy: { updatedAt: "desc" },
    include: { updatedBy: { select: { name: true, email: true } } },
  });
  if (!b || !b.overrides) return null;
  return {
    draft: b.overrides as unknown as BinderDraft,
    updatedAt: b.updatedAt.toISOString(),
    updatedByName: b.updatedBy?.name ?? b.updatedBy?.email ?? null,
  };
}

// Conflict-checked upsert. `baseUpdatedAt` is the timestamp the client last saw;
// if the stored binder is newer (or already exists when the client expected
// none), the save is rejected and the server's version is returned.
export async function saveJournalDraft(
  journalId: string,
  draft: BinderDraft,
  baseUpdatedAt: string | undefined,
  userId: string,
): Promise<SaveResult> {
  const key = issueKey(draft);
  const composite = { journalId_volume_issue_year: { journalId, ...key } };

  const existing = await prisma.binder.findUnique({
    where: composite,
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  if (existing && existing.updatedAt.toISOString() !== (baseUpdatedAt ?? null)) {
    return {
      status: "conflict",
      draft: existing.overrides as unknown as BinderDraft,
      updatedAt: existing.updatedAt.toISOString(),
      updatedByName: existing.updatedBy?.name ?? existing.updatedBy?.email ?? null,
    };
  }

  const data = {
    monthRange: draft.issueMonthRange ?? null,
    directorParagraphs: draft.directorParagraphs ?? [],
    overrides: draft as unknown as object,
    updatedById: userId,
  };

  const saved = await prisma.$transaction(async (tx) => {
    const binder = await tx.binder.upsert({
      where: composite,
      update: data,
      create: { journalId, ...key, ...data },
      include: { updatedBy: { select: { name: true, email: true } } },
    });

    // Mirror the table of contents into structured Article rows.
    await tx.article.deleteMany({ where: { binderId: binder.id } });
    const rows = (draft.contentRows ?? []).filter((r) => r.title?.trim());
    if (rows.length) {
      await tx.article.createMany({
        data: rows.map((r, index) => ({
          binderId: binder.id,
          title: r.title,
          authors: r.author || null,
          startPage: r.page || null,
          order: index,
        })),
      });
    }
    return binder;
  });

  return {
    status: "ok",
    updatedAt: saved.updatedAt.toISOString(),
    updatedByName: saved.updatedBy?.name ?? saved.updatedBy?.email ?? null,
  };
}
