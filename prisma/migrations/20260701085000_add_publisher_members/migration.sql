-- CreateTable
CREATE TABLE "PublisherMember" (
    "id" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "role" "JournalRole" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PublisherMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublisherMember_publisherId_idx" ON "PublisherMember"("publisherId");

-- CreateIndex
CREATE UNIQUE INDEX "PublisherMember_publisherId_profileId_role_key" ON "PublisherMember"("publisherId", "profileId", "role");

-- AddForeignKey
ALTER TABLE "PublisherMember" ADD CONSTRAINT "PublisherMember_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublisherMember" ADD CONSTRAINT "PublisherMember_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: management team is now publisher-scoped. Copy each journal's
-- MANAGEMENT_HEAD/MEMBER members up to its publisher, deduplicated on
-- (publisher, profile, role) with the lowest existing order.
INSERT INTO "PublisherMember" ("id", "publisherId", "profileId", "role", "order")
SELECT gen_random_uuid()::text, j."publisherId", jm."profileId", jm."role", MIN(jm."order")
FROM "JournalMember" jm
JOIN "Journal" j ON j."id" = jm."journalId"
WHERE jm."role" IN ('MANAGEMENT_HEAD', 'MANAGEMENT_MEMBER')
  AND j."publisherId" IS NOT NULL
GROUP BY j."publisherId", jm."profileId", jm."role"
ON CONFLICT ("publisherId", "profileId", "role") DO NOTHING;

-- Journals now keep only editorial members + their journal-manager; drop the
-- migrated management members.
DELETE FROM "JournalMember"
WHERE "role" IN ('MANAGEMENT_HEAD', 'MANAGEMENT_MEMBER');
