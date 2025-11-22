-- Add assignment expiration tracking to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS assignment_expires_at TIMESTAMP;

-- Document the purpose of the column
COMMENT ON COLUMN jobs.assignment_expires_at IS 'Timestamp when the current contractor assignment expires for auto-reassignment';
