-- CreateTable
CREATE TABLE "AboutNotes" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "paragraphs" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutNotes_pkey" PRIMARY KEY ("id")
);
