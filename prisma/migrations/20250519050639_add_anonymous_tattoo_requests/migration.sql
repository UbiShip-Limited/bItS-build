/*
  Warnings:

  - A unique constraint covering the columns `[tracking_token]` on the table `tattoo_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "tattoo_requests" DROP CONSTRAINT "tattoo_requests_customer_id_fkey";

-- AlterTable
ALTER TABLE "tattoo_requests" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "tracking_token" TEXT,
ALTER COLUMN "customer_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tattoo_requests_tracking_token_key" ON "tattoo_requests"("tracking_token");

-- AddForeignKey
ALTER TABLE "tattoo_requests" ADD CONSTRAINT "tattoo_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
