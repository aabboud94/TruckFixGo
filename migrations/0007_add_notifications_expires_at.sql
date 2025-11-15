-- Add missing expires_at column to notifications table
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;