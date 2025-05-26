-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_customer_id_fkey";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "customer_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tattoo_requests" ADD COLUMN     "additional_notes" TEXT,
ADD COLUMN     "contact_preference" TEXT,
ADD COLUMN     "preferred_artist" TEXT,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "timeframe" TEXT;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
