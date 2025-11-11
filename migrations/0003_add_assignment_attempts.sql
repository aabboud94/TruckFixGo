-- Add assignment attempts tracking to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS assignment_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_assignment_attempt_at TIMESTAMP;

-- Add index on assignment_attempts and status for efficient querying
CREATE INDEX IF NOT EXISTS idx_jobs_assignment_attempts ON jobs (assignment_attempts, status) WHERE status = 'assigned';
CREATE INDEX IF NOT EXISTS idx_jobs_last_assignment_attempt_at ON jobs (last_assignment_attempt_at) WHERE status = 'assigned';

-- Add comment explaining the fields
COMMENT ON COLUMN jobs.assignment_attempts IS 'Number of times this job has been assigned to contractors';
COMMENT ON COLUMN jobs.last_assignment_attempt_at IS 'Timestamp of the last assignment attempt for tracking reassignment eligibility';