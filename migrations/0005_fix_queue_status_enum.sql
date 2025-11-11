-- Migration to add missing values to queue_status enum
-- Fixes: "invalid input value for enum queue_status: \"assigned\""

-- PostgreSQL doesn't allow direct alteration of enum types, so we need to:
-- 1. Add the new values to the enum type

-- Add 'assigned' value (for jobs actively being worked on)
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'assigned' AFTER 'queued';

-- Add 'skipped' value (for jobs skipped in the queue)
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'skipped' AFTER 'assigned';

-- Add 'expired' value (for jobs that expired in the queue)
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'expired' AFTER 'skipped';

-- Update any existing records that might need status adjustment
-- (This is safe to run even if there are no records to update)

-- Comment explaining the complete enum values after this migration:
-- queue_status values: 'current', 'queued', 'assigned', 'skipped', 'expired', 'completed', 'cancelled'