-- Create enum for queue status
CREATE TYPE queue_status AS ENUM ('current', 'queued', 'completed', 'cancelled');

-- Create contractor job queue table
CREATE TABLE contractor_job_queue (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id VARCHAR NOT NULL REFERENCES users(id),
  job_id VARCHAR NOT NULL REFERENCES jobs(id),
  position INTEGER NOT NULL,
  status queue_status NOT NULL DEFAULT 'queued',
  queued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_queue_job ON contractor_job_queue(job_id);
CREATE INDEX idx_queue_contractor_position ON contractor_job_queue(contractor_id, position);
CREATE INDEX idx_queue_contractor_status ON contractor_job_queue(contractor_id, status);
CREATE INDEX idx_queue_status ON contractor_job_queue(status);

-- Add comment to table
COMMENT ON TABLE contractor_job_queue IS 'Queue system for managing contractor job assignments';