-- Add reminder tracking fields to PaymentLink table
ALTER TABLE "PaymentLink" ADD COLUMN IF NOT EXISTS "enableReminders" BOOLEAN DEFAULT true;
ALTER TABLE "PaymentLink" ADD COLUMN IF NOT EXISTS "lastReminderSent" TIMESTAMP(3);
ALTER TABLE "PaymentLink" ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER DEFAULT 0;
ALTER TABLE "PaymentLink" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "PaymentLink" ADD COLUMN IF NOT EXISTS "reminderSchedule" JSONB DEFAULT '[2, 7, 14]';

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS "PaymentLink_reminder_status_idx" ON "PaymentLink"("status", "enableReminders", "reminderCount");
CREATE INDEX IF NOT EXISTS "PaymentLink_expires_idx" ON "PaymentLink"("expiresAt");