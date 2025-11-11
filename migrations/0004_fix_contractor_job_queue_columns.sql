-- Migration to add missing columns to contractor_job_queue table
-- This fixes the "estimated_start_time" does not exist error

-- Add missing columns to match schema.ts definition
ALTER TABLE contractor_job_queue
ADD COLUMN IF NOT EXISTS estimated_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS skipped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS skip_reason TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS actual_duration INTEGER,
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS auto_assigned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS distance_to_job DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS notifications_sent JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for estimated_start_time for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_estimated_start ON contractor_job_queue(estimated_start_time);

-- Migrate data from started_at to estimated_start_time and actual_start_time
UPDATE contractor_job_queue 
SET estimated_start_time = started_at,
    actual_start_time = started_at
WHERE started_at IS NOT NULL;

-- Optional: Drop the old started_at column after migration
-- We'll keep it for now to avoid breaking anything else
-- ALTER TABLE contractor_job_queue DROP COLUMN IF EXISTS started_at;