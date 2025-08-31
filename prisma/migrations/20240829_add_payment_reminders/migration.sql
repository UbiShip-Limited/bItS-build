-- Add reminder tracking fields to payment_links table
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "enable_reminders" BOOLEAN DEFAULT true;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "last_reminder_sent" TIMESTAMP(3);
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "reminder_count" INTEGER DEFAULT 0;
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "payment_links" ADD COLUMN IF NOT EXISTS "reminder_schedule" JSONB DEFAULT '[2, 7, 14]';

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS "payment_links_reminder_status_idx" ON "payment_links"("status", "enable_reminders", "reminder_count");
CREATE INDEX IF NOT EXISTS "payment_links_expires_idx" ON "payment_links"("expires_at");