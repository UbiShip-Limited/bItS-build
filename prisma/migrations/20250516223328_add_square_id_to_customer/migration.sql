/*
  Warnings:

  - A unique constraint covering the columns `[square_id]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[square_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "payment_id" TEXT,
ADD COLUMN     "price_quote" DOUBLE PRECISION,
ADD COLUMN     "square_id" TEXT,
ADD COLUMN     "start_time" TIMESTAMP(3),
ADD COLUMN     "tattoo_request_id" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "resource_type" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "square_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "booking_id" TEXT,
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "payment_type" TEXT,
ADD COLUMN     "reference_id" TEXT;

-- AlterTable
ALTER TABLE "tattoo_requests" ADD COLUMN     "deposit_amount" DOUBLE PRECISION,
ADD COLUMN     "deposit_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "final_amount" DOUBLE PRECISION,
ADD COLUMN     "payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_square_id_key" ON "appointments"("square_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_square_id_key" ON "customers"("square_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tattoo_request_id_fkey" FOREIGN KEY ("tattoo_request_id") REFERENCES "tattoo_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tattoo_requests" ADD CONSTRAINT "tattoo_requests_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
