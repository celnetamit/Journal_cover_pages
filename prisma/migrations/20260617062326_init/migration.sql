-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "JournalRole" AS ENUM ('EDITOR_IN_CHIEF', 'EDITORIAL_BOARD', 'MANAGING_EDITOR', 'ADVISOR', 'REVIEWER', 'MANAGEMENT_HEAD', 'MANAGEMENT_MEMBER');

-- CreateEnum
CREATE TYPE "SubscriptionMode" AS ENUM ('PRINT', 'ONLINE', 'PRINT_ONLINE');

-- CreateEnum
CREATE TYPE "BinderType" AS ENUM ('REGULAR', 'SPECIAL');

-- CreateEnum
CREATE TYPE "JournalFrequency" AS ENUM ('ANNUAL', 'BIANNUAL', 'TRIANNUAL', 'QUARTERLY', 'BIMONTHLY', 'MONTHLY', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "photoUrl" TEXT,
    "designation" TEXT,
    "biography" TEXT,
    "affiliation" TEXT,
    "department" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "registeredAddress" TEXT,
    "salesAddress" TEXT,
    "cin" TEXT,
    "gst" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNo" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankSwift" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "directorId" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "SubscriptionMode" NOT NULL,
    "priceUsd" DOUBLE PRECISION,
    "priceInr" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalSubscription" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION,
    "priceInr" DOUBLE PRECISION,

    CONSTRAINT "JournalSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "shortName" TEXT,
    "website" TEXT,
    "issnPrint" TEXT,
    "issnOnline" TEXT,
    "sjif" TEXT,
    "icv" TEXT,
    "doi" TEXT,
    "impactFactor" TEXT,
    "indexing" TEXT[],
    "indexingLogoUrl" TEXT,
    "codeN" TEXT,
    "startedSince" TEXT,
    "typeOfPublication" TEXT,
    "access" TEXT,
    "language" TEXT,
    "issuesPerYear" INTEGER,
    "frequency" "JournalFrequency" NOT NULL DEFAULT 'OTHER',
    "frequencyLabel" TEXT,
    "coverFrontUrl" TEXT,
    "coverBackUrl" TEXT,
    "logoUrl" TEXT,
    "about" TEXT,
    "focusScope" TEXT[],
    "objectives" TEXT[],
    "salientFeatures" TEXT[],
    "keywords" TEXT[],
    "manuscriptNotice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "domainId" TEXT,
    "publisherId" TEXT,
    "managerId" TEXT,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalMember" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "role" "JournalRole" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JournalMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Binder" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "volume" TEXT,
    "issue" TEXT,
    "year" INTEGER,
    "type" "BinderType" NOT NULL DEFAULT 'REGULAR',
    "monthRange" TEXT,
    "directorParagraphs" TEXT[],
    "overrides" JSONB,
    "layout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Binder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "startPage" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Profile_email_idx" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_name_idx" ON "Profile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Publisher_name_key" ON "Publisher"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_name_key" ON "Subscription"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JournalSubscription_journalId_subscriptionId_key" ON "JournalSubscription"("journalId", "subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_legacyId_key" ON "Journal"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_slug_key" ON "Journal"("slug");

-- CreateIndex
CREATE INDEX "Journal_abbreviation_idx" ON "Journal"("abbreviation");

-- CreateIndex
CREATE INDEX "JournalMember_journalId_idx" ON "JournalMember"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalMember_journalId_profileId_role_key" ON "JournalMember"("journalId", "profileId", "role");

-- CreateIndex
CREATE INDEX "Binder_journalId_idx" ON "Binder"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "Binder_journalId_volume_issue_year_key" ON "Binder"("journalId", "volume", "issue", "year");

-- CreateIndex
CREATE INDEX "Article_binderId_idx" ON "Article"("binderId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publisher" ADD CONSTRAINT "Publisher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalSubscription" ADD CONSTRAINT "JournalSubscription_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalSubscription" ADD CONSTRAINT "JournalSubscription_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalMember" ADD CONSTRAINT "JournalMember_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalMember" ADD CONSTRAINT "JournalMember_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
