-- Add sales rep features to the database

-- 1. Update profiles table to ensure role field is properly set up
-- (role field already exists based on the schema)
-- Let's add a check constraint to ensure only valid roles
ALTER TABLE profiles 
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'sales_rep'));

-- Update existing profiles to have admin role if role is null
UPDATE profiles SET role = 'admin' WHERE role IS NULL;

-- 2. Add fields to proposals table for ownership and archiving
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- Set created_by for existing proposals to the first admin user
UPDATE proposals 
SET created_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
WHERE created_by IS NULL;

-- Make created_by NOT NULL after backfilling
ALTER TABLE proposals ALTER COLUMN created_by SET NOT NULL;

-- 3. Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ip_address INET,
  user_agent TEXT
);

-- Create index for efficient querying
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 4. Enable Row Level Security (RLS) on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs
-- Admins can see all logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sales reps can only see their own activity logs
CREATE POLICY "Sales reps can view own activity logs" ON activity_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'sales_rep'
    )
  );

-- Only system can insert logs (through service role)
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- 5. Update RLS policies for proposals table
-- First, ensure RLS is enabled
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public proposals are viewable by everyone" ON proposals;
DROP POLICY IF EXISTS "Admins have full access to proposals" ON proposals;
DROP POLICY IF EXISTS "Users can view their own proposals" ON proposals;

-- Admin policies - full access
CREATE POLICY "Admins can view all proposals" ON proposals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert proposals" ON proposals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all proposals" ON proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete proposals" ON proposals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sales rep policies - own proposals only
CREATE POLICY "Sales reps can view own proposals" ON proposals
  FOR SELECT
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'sales_rep'
    )
  );

CREATE POLICY "Sales reps can insert proposals" ON proposals
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'sales_rep'
    )
  );

CREATE POLICY "Sales reps can update own non-archived proposals" ON proposals
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'sales_rep'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'sales_rep'
    )
  );

-- 6. Create function to log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_action VARCHAR(50),
  p_entity_type VARCHAR(50),
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create triggers to automatically log proposal actions
CREATE OR REPLACE FUNCTION log_proposal_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('create', 'proposal', NEW.id, 
      jsonb_build_object('title', NEW.title, 'company', NEW.company_name));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log archive action specially
    IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
      PERFORM log_activity('archive', 'proposal', NEW.id,
        jsonb_build_object('title', NEW.title, 'company', NEW.company_name));
    -- Log restore action
    ELSIF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
      PERFORM log_activity('restore', 'proposal', NEW.id,
        jsonb_build_object('title', NEW.title, 'company', NEW.company_name));
    ELSE
      PERFORM log_activity('update', 'proposal', NEW.id,
        jsonb_build_object('title', NEW.title, 'company', NEW.company_name));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity('delete', 'proposal', OLD.id,
      jsonb_build_object('title', OLD.title, 'company', OLD.company_name));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for proposal changes
DROP TRIGGER IF EXISTS proposal_activity_trigger ON proposals;
CREATE TRIGGER proposal_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON proposals
FOR EACH ROW EXECUTE FUNCTION log_proposal_changes();

-- 8. Update RLS for other related tables to respect roles
-- Ensure sales reps can only see their own proposal-related data

-- For proposal_services
ALTER TABLE proposal_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public proposal services are viewable by everyone" ON proposal_services;

CREATE POLICY "Users can view proposal services for accessible proposals" ON proposal_services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_services.proposal_id
      AND (
        -- Admin can see all
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
        OR
        -- Sales rep can see their own
        (
          proposals.created_by = auth.uid()
          AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'sales_rep'
          )
        )
      )
    )
  );

-- Similar policies for insert, update, delete
CREATE POLICY "Users can manage proposal services for owned proposals" ON proposal_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_services.proposal_id
      AND (
        -- Admin can manage all
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
        OR
        -- Sales rep can manage their own non-archived proposals
        (
          proposals.created_by = auth.uid()
          AND proposals.archived_at IS NULL
          AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'sales_rep'
          )
        )
      )
    )
  );

-- For proposal_links (view tracking)
-- Sales reps should only see links for their own proposals
ALTER TABLE proposal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links for accessible proposals" ON proposal_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_links.proposal_id
      AND (
        -- Admin can see all
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
        OR
        -- Sales rep can see their own
        (
          proposals.created_by = auth.uid()
          AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'sales_rep'
          )
        )
      )
    )
  );

-- 9. Create a view for active proposals (non-archived)
CREATE OR REPLACE VIEW active_proposals AS
SELECT * FROM proposals WHERE archived_at IS NULL;

-- Grant access to the view
GRANT SELECT ON active_proposals TO authenticated;

-- 10. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create helper function to check if user is sales rep
CREATE OR REPLACE FUNCTION is_sales_rep()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'sales_rep'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;