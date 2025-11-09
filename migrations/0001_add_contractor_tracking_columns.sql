-- Add columns for tracking contractor assignment and online status
ALTER TABLE contractor_profiles
ADD COLUMN IF NOT EXISTS last_assigned_at timestamp,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamp;

-- Add index for efficient queries on assignment time
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_last_assigned_at 
ON contractor_profiles(last_assigned_at);

-- Add columns to jobs table for tracking assignment attempts
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS assignment_attempted_at timestamp,
ADD COLUMN IF NOT EXISTS assignment_notification_sent boolean DEFAULT false;

-- Create index for finding unassigned jobs
CREATE INDEX IF NOT EXISTS idx_jobs_assignment_status
ON jobs(status, assignment_attempted_at) 
WHERE status = 'new';
