-- Add expiration fields to proposals table
ALTER TABLE proposals
ADD COLUMN validity_days INTEGER DEFAULT 30,
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Update expires_at for existing proposals based on proposal_date + 30 days
UPDATE proposals
SET expires_at = (proposal_date::timestamp + interval '30 days')
WHERE expires_at IS NULL;

-- Add 'expired' to the status enum
-- First, we need to create a new enum type with the additional value
CREATE TYPE proposal_status_new AS ENUM ('draft', 'sent', 'accepted', 'paid', 'rejected', 'expired');

-- Update the column to use the new enum type
ALTER TABLE proposals
ALTER COLUMN status TYPE proposal_status_new
USING status::text::proposal_status_new;

-- Drop the old enum type (if it exists)
DROP TYPE IF EXISTS proposal_status;

-- Rename the new enum type
ALTER TYPE proposal_status_new RENAME TO proposal_status;

-- Create a function to calculate expires_at based on proposal_date and validity_days
CREATE OR REPLACE FUNCTION update_proposal_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.validity_days IS NOT NULL THEN
    NEW.expires_at := (NEW.proposal_date::timestamp + (NEW.validity_days || ' days')::interval);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update expires_at when proposal is created or updated
CREATE TRIGGER set_proposal_expires_at
BEFORE INSERT OR UPDATE OF proposal_date, validity_days ON proposals
FOR EACH ROW
EXECUTE FUNCTION update_proposal_expires_at();

-- Create a function to automatically expire proposals
CREATE OR REPLACE FUNCTION check_and_expire_proposals()
RETURNS void AS $$
BEGIN
  UPDATE proposals
  SET status = 'expired'
  WHERE status IN ('draft', 'sent', 'rejected')
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run every hour (requires pg_cron extension)
-- Note: This requires pg_cron to be enabled in your Supabase project
-- You can also call this function from your application's cron job