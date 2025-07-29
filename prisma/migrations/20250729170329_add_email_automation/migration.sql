-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "email_preferences" JSONB,
ADD COLUMN     "email_unsubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_activity_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "email_automation_logs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "appointment_id" TEXT,
    "tattoo_request_id" TEXT,
    "email_type" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "email_automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_automation_settings" (
    "id" TEXT NOT NULL,
    "email_type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timing_hours" INTEGER,
    "timing_minutes" INTEGER,
    "business_hours_only" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_automation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_automation_logs_customer_id_idx" ON "email_automation_logs"("customer_id");

-- CreateIndex
CREATE INDEX "email_automation_logs_appointment_id_idx" ON "email_automation_logs"("appointment_id");

-- CreateIndex
CREATE INDEX "email_automation_logs_email_type_idx" ON "email_automation_logs"("email_type");

-- CreateIndex
CREATE INDEX "email_automation_logs_sent_at_idx" ON "email_automation_logs"("sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_automation_logs_customer_id_appointment_id_email_type_key" ON "email_automation_logs"("customer_id", "appointment_id", "email_type", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_automation_settings_email_type_key" ON "email_automation_settings"("email_type");

-- AddForeignKey
ALTER TABLE "email_automation_logs" ADD CONSTRAINT "email_automation_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_automation_logs" ADD CONSTRAINT "email_automation_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_automation_logs" ADD CONSTRAINT "email_automation_logs_tattoo_request_id_fkey" FOREIGN KEY ("tattoo_request_id") REFERENCES "tattoo_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
