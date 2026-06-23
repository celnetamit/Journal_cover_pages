-- CreateTable
CREATE TABLE "SubscriptionTier" (
    "id" TEXT NOT NULL,
    "issuesPerYear" INTEGER NOT NULL,
    "printInr" DOUBLE PRECISION,
    "singleIssueInr" DOUBLE PRECISION,
    "onlineInr" DOUBLE PRECISION,
    "printOnlineInr" DOUBLE PRECISION,
    "printUsd" DOUBLE PRECISION,
    "onlineUsd" DOUBLE PRECISION,
    "printOnlineUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTier_issuesPerYear_key" ON "SubscriptionTier"("issuesPerYear");
