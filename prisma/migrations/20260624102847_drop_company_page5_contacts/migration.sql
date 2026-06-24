/*
  Warnings:

  - You are about to drop the column `dispatchContactEmail` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `dispatchContactName` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `dispatchContactPhone` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `salesContactEmail` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `salesContactName` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `salesContactPhone` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "dispatchContactEmail",
DROP COLUMN "dispatchContactName",
DROP COLUMN "dispatchContactPhone",
DROP COLUMN "salesContactEmail",
DROP COLUMN "salesContactName",
DROP COLUMN "salesContactPhone";
