import "server-only";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import type { BinderFileKind } from "@/generated/prisma/enums";

// Storage + assembly for the Binder QA module. PDFs (front matter, one
// manuscript per TOC article, and the assembled binder) are stored as bytes in
// the BinderFile table, mirroring how images live in Asset.

export type BinderFileSummary = {
  id: string;
  kind: BinderFileKind;
  articleId: string | null;
  filename: string | null;
  byteSize: number;
  pageCount: number | null;
  createdAt: string;
  uploadedByName: string | null;
};

// Stored on the ASSEMBLED file so QA checks can cross-verify the TOC against
// where each article actually landed in the merged PDF (1-indexed pages).
export type AssemblyMeta = {
  frontMatterPages: number;
  sourceFileIds: string[];
  /** True when a blank page was appended so the binder ends on an even count. */
  paddedBlankPage?: boolean;
  articles: Array<{
    articleId: string;
    title: string;
    authors: string | null;
    tocStartPage: string | null;
    startPage: number;
    endPage: number;
  }>;
};

const name = (u: { name: string | null; email: string | null } | null) => u?.name ?? u?.email ?? null;

async function pdfPageCount(bytes: Buffer): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function listBinderFiles(binderId: string): Promise<BinderFileSummary[]> {
  const files = await prisma.binderFile.findMany({
    where: { binderId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      articleId: true,
      filename: true,
      byteSize: true,
      pageCount: true,
      createdAt: true,
      uploadedBy: { select: { name: true, email: true } },
    },
  });
  return files.map((f) => ({
    id: f.id,
    kind: f.kind,
    articleId: f.articleId,
    filename: f.filename,
    byteSize: f.byteSize,
    pageCount: f.pageCount,
    createdAt: f.createdAt.toISOString(),
    uploadedByName: name(f.uploadedBy),
  }));
}

export async function getBinderFile(fileId: string) {
  return prisma.binderFile.findUnique({ where: { id: fileId } });
}

// Upload (or replace) a PDF. FRONT_MATTER and COVER are unique per binder;
// MANUSCRIPT is unique per article; replacing deletes the previous slot file.
export async function saveBinderFile(input: {
  binderId: string;
  kind: Extract<BinderFileKind, "FRONT_MATTER" | "MANUSCRIPT" | "COVER">;
  articleId?: string | null;
  filename: string | null;
  bytes: Buffer;
  userId: string;
}): Promise<{ ok: true; file: BinderFileSummary } | { ok: false; error: string }> {
  const { binderId, kind, articleId, filename, bytes, userId } = input;

  if (kind === "MANUSCRIPT") {
    if (!articleId) return { ok: false, error: "A manuscript must be attached to a TOC article." };
    const article = await prisma.article.findUnique({ where: { id: articleId }, select: { binderId: true } });
    if (!article || article.binderId !== binderId) {
      return { ok: false, error: "Article does not belong to this binder." };
    }
  }

  let pageCount: number;
  try {
    pageCount = await pdfPageCount(bytes);
  } catch {
    return { ok: false, error: "File is not a readable PDF." };
  }

  const file = await prisma.$transaction(async (tx) => {
    if (kind === "MANUSCRIPT") {
      await tx.binderFile.deleteMany({ where: { binderId, kind, articleId } });
    } else {
      await tx.binderFile.deleteMany({ where: { binderId, kind } });
    }
    return tx.binderFile.create({
      data: {
        binderId,
        kind,
        articleId: kind === "MANUSCRIPT" ? articleId : null,
        filename,
        data: new Uint8Array(bytes),
        byteSize: bytes.length,
        pageCount,
        uploadedById: userId,
      },
      select: {
        id: true,
        kind: true,
        articleId: true,
        filename: true,
        byteSize: true,
        pageCount: true,
        createdAt: true,
        uploadedBy: { select: { name: true, email: true } },
      },
    });
  });

  return {
    ok: true,
    file: {
      id: file.id,
      kind: file.kind,
      articleId: file.articleId,
      filename: file.filename,
      byteSize: file.byteSize,
      pageCount: file.pageCount,
      createdAt: file.createdAt.toISOString(),
      uploadedByName: name(file.uploadedBy),
    },
  };
}

export async function deleteBinderFile(fileId: string, binderId: string): Promise<boolean> {
  const { count } = await prisma.binderFile.deleteMany({ where: { id: fileId, binderId } });
  return count > 0;
}

export type AssembleResult =
  | { ok: true; fileId: string; pageCount: number; meta: AssemblyMeta }
  | { ok: false; error: string };

// Merge front matter + every article's manuscript (in TOC order) into the
// final binder PDF. Replaces any previous ASSEMBLED file — QA runs pointing at
// the old file lose their link (SetNull), which is what invalidates a stale
// pass verdict after re-assembly.
export async function assembleBinder(binderId: string, userId: string): Promise<AssembleResult> {
  const [frontMatter, articles] = await Promise.all([
    prisma.binderFile.findFirst({ where: { binderId, kind: "FRONT_MATTER" } }),
    prisma.article.findMany({
      where: { binderId },
      orderBy: { order: "asc" },
      include: { manuscript: true },
    }),
  ]);

  if (!frontMatter) return { ok: false, error: "Upload or export the front-matter PDF first." };
  if (articles.length === 0) return { ok: false, error: "The binder has no TOC articles — add contents rows first." };
  const missing = articles.filter((a) => !a.manuscript);
  if (missing.length) {
    return {
      ok: false,
      error: `Missing manuscript PDF for ${missing.length} article(s): ${missing
        .slice(0, 3)
        .map((a) => `“${a.title}”`)
        .join(", ")}${missing.length > 3 ? "…" : ""}`,
    };
  }

  try {
    const merged = await PDFDocument.create();
    const addAll = async (bytes: Uint8Array) => {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      for (const page of pages) merged.addPage(page);
      return src.getPageCount();
    };

    const frontMatterPages = await addAll(frontMatter.data);
    const meta: AssemblyMeta = {
      frontMatterPages,
      sourceFileIds: [frontMatter.id, ...articles.map((a) => a.manuscript!.id)],
      articles: [],
    };

    let cursor = frontMatterPages;
    for (const article of articles) {
      const count = await addAll(article.manuscript!.data);
      meta.articles.push({
        articleId: article.id,
        title: article.title,
        authors: article.authors,
        tocStartPage: article.startPage,
        startPage: cursor + 1,
        endPage: cursor + count,
      });
      cursor += count;
    }

    // Print binders must end on an even page count (perfect binding). Pad with
    // one blank verso, matching the size of the last page.
    if (cursor % 2 === 1) {
      const last = merged.getPage(cursor - 1);
      merged.addPage([last.getWidth(), last.getHeight()]);
      cursor += 1;
      meta.paddedBlankPage = true;
    }

    const bytes = new Uint8Array(await merged.save());
    const file = await prisma.$transaction(async (tx) => {
      await tx.binderFile.deleteMany({ where: { binderId, kind: "ASSEMBLED" } });
      return tx.binderFile.create({
        data: {
          binderId,
          kind: "ASSEMBLED",
          filename: "assembled-binder.pdf",
          data: bytes,
          byteSize: bytes.length,
          pageCount: cursor,
          meta: meta as unknown as object,
          uploadedById: userId,
        },
        select: { id: true },
      });
    });

    return { ok: true, fileId: file.id, pageCount: cursor, meta };
  } catch (err) {
    console.error("Binder assembly failed", err);
    return { ok: false, error: "Assembly failed — one of the PDFs could not be merged." };
  }
}
