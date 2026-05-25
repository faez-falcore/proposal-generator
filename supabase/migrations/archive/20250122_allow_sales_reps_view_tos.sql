-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can view all ToS templates" ON tos_templates;

-- Create new policy that allows both admins and sales_reps to view ToS templates
CREATE POLICY "Admins and sales reps can view ToS templates" ON tos_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'sales_rep')
    )
  );