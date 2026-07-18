-- CreateEnum
CREATE TYPE "BinderFileKind" AS ENUM ('FRONT_MATTER', 'MANUSCRIPT', 'ASSEMBLED');

-- CreateEnum
CREATE TYPE "BinderReviewStatus" AS ENUM ('DRAFT', 'IN_INTERNAL_REVIEW');

-- CreateEnum
CREATE TYPE "QaRunStatus" AS ENUM ('RUNNING', 'COMPLETE', 'ERROR');

-- AlterTable
ALTER TABLE "Binder" ADD COLUMN     "reviewStatus" "BinderReviewStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" TEXT;

-- CreateTable
CREATE TABLE "BinderFile" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "kind" "BinderFileKind" NOT NULL,
    "articleId" TEXT,
    "filename" TEXT,
    "data" BYTEA NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "pageCount" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "BinderFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderQaRun" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "status" "QaRunStatus" NOT NULL DEFAULT 'RUNNING',
    "report" JSONB,
    "counts" JSONB,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "assembledFileId" TEXT,
    "createdById" TEXT,

    CONSTRAINT "BinderQaRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BinderFile_articleId_key" ON "BinderFile"("articleId");

-- CreateIndex
CREATE INDEX "BinderFile_binderId_idx" ON "BinderFile"("binderId");

-- CreateIndex
CREATE INDEX "BinderQaRun_binderId_createdAt_idx" ON "BinderQaRun"("binderId", "createdAt");

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderFile" ADD CONSTRAINT "BinderFile_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderFile" ADD CONSTRAINT "BinderFile_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderFile" ADD CONSTRAINT "BinderFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderQaRun" ADD CONSTRAINT "BinderQaRun_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderQaRun" ADD CONSTRAINT "BinderQaRun_assembledFileId_fkey" FOREIGN KEY ("assembledFileId") REFERENCES "BinderFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderQaRun" ADD CONSTRAINT "BinderQaRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
