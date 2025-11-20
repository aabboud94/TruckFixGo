-- Add missing columns to invoices table
ALTER TABLE "invoices" 
ADD COLUMN IF NOT EXISTS "amount_due" numeric(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'draft' NOT NULL,
ADD COLUMN IF NOT EXISTS "issue_date" timestamp DEFAULT now() NOT NULL,
ADD COLUMN IF NOT EXISTS "sent_at" timestamp,
ADD COLUMN IF NOT EXISTS "completion_notes" text,
ADD COLUMN IF NOT EXISTS "completion_photos" text[],
ADD COLUMN IF NOT EXISTS "completed_at" timestamp,
ADD COLUMN IF NOT EXISTS "contractor_signature" text;

-- Update amount_due for existing records based on total_amount - paid_amount
UPDATE "invoices" 
SET "amount_due" = "total_amount" - "paid_amount"
WHERE "amount_due" = 0;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status");