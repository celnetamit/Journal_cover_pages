/*
  Warnings:

  - You are about to drop the column `openAccessIndia` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `openAccessOther` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `openAccessSaarc` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "openAccessIndia",
DROP COLUMN "openAccessOther",
DROP COLUMN "openAccessSaarc";
