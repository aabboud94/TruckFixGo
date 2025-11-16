-- Add email_logs table for tracking emails
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR NOT NULL,
  email_type VARCHAR NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status VARCHAR DEFAULT 'pending',
  message_id VARCHAR,
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  job_id VARCHAR REFERENCES jobs(id),
  contractor_id VARCHAR REFERENCES contractor_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for email_logs
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_job_id ON email_logs(job_id);
CREATE INDEX idx_email_logs_contractor_id ON email_logs(contractor_id);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- Add missing fields to contractor_profiles table
ALTER TABLE contractor_profiles
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"monday":{"start":"08:00","end":"18:00"},"tuesday":{"start":"08:00","end":"18:00"},"wednesday":{"start":"08:00","end":"18:00"},"thursday":{"start":"08:00","end":"18:00"},"friday":{"start":"08:00","end":"18:00"},"saturday":{"start":"09:00","end":"16:00"},"sunday":{"start":"10:00","end":"14:00"}}'::jsonb,
ADD COLUMN IF NOT EXISTS current_job_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_jobs_per_day INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS service_cities TEXT[] DEFAULT '{}';

-- Update existing contractors to have default service cities (Detroit metro area)
UPDATE contractor_profiles 
SET service_cities = ARRAY['Detroit', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Livonia', 'Dearborn', 'Troy', 'Westland', 'Farmington Hills', 'Rochester Hills']
WHERE service_cities = '{}' OR service_cities IS NULL;