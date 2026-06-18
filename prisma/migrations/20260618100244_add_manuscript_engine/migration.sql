-- CreateTable
CREATE TABLE "ManuscriptEngine" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heading" TEXT,
    "leadText" TEXT,
    "steps" TEXT[],
    "scanLabel" TEXT,
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManuscriptEngine_pkey" PRIMARY KEY ("id")
);
