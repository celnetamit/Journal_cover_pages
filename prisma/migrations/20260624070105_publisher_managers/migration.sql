-- AlterTable
ALTER TABLE "Publisher" ADD COLUMN     "dispatchManagerId" TEXT,
ADD COLUMN     "subscriptionManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "Publisher" ADD CONSTRAINT "Publisher_subscriptionManagerId_fkey" FOREIGN KEY ("subscriptionManagerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publisher" ADD CONSTRAINT "Publisher_dispatchManagerId_fkey" FOREIGN KEY ("dispatchManagerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
