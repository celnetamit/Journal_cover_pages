-- About is now publisher-only; drop the per-journal column (data discarded).
ALTER TABLE "Journal" DROP COLUMN "about";
