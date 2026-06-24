/*
  Warnings:

  - You are about to drop the column `sealUrl` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "sealUrl";

-- AlterTable
ALTER TABLE "Publisher" ADD COLUMN     "sealUrl" TEXT;
