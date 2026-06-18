-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "directorDeskParagraphs" TEXT[],
ADD COLUMN     "directorDeskTitle" TEXT,
ADD COLUMN     "dispatchContactEmail" TEXT,
ADD COLUMN     "dispatchContactName" TEXT,
ADD COLUMN     "dispatchContactPhone" TEXT,
ADD COLUMN     "salesContactEmail" TEXT,
ADD COLUMN     "salesContactName" TEXT,
ADD COLUMN     "salesContactPhone" TEXT;

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "focusNotes" TEXT[];

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "signatureUrl" TEXT;
