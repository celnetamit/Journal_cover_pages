-- Drop the deprecated indexing-logo column (no longer surfaced in the UI).
ALTER TABLE "Journal" DROP COLUMN "indexingLogoUrl";
