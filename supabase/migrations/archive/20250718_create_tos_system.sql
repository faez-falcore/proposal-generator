-- Create ToS templates table
CREATE TABLE IF NOT EXISTS tos_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  payment_type VARCHAR(50) CHECK (payment_type IN ('full', 'split', 'custom')),
  terms JSONB NOT NULL DEFAULT '[]'::JSONB,
  variables JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create packages table if it doesn't exist
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'AED',
  features JSONB DEFAULT '[]'::JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package-ToS mapping table
CREATE TABLE IF NOT EXISTS package_tos_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  tos_template_id UUID REFERENCES tos_templates(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, tos_template_id)
);

-- Add ToS fields to proposals table (nullable for backward compatibility)
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS tos_template_id UUID REFERENCES tos_templates(id),
ADD COLUMN IF NOT EXISTS tos_snapshot JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tos_templates_active ON tos_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_tos_templates_payment_type ON tos_templates(payment_type);
CREATE INDEX IF NOT EXISTS idx_package_tos_mappings_package ON package_tos_mappings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_tos_mappings_default ON package_tos_mappings(package_id, is_default);
CREATE INDEX IF NOT EXISTS idx_proposals_tos_template ON proposals(tos_template_id);

-- RLS Policies for tos_templates
ALTER TABLE tos_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can view ToS templates
CREATE POLICY "Admins can view all ToS templates" ON tos_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can create ToS templates
CREATE POLICY "Admins can create ToS templates" ON tos_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update ToS templates
CREATE POLICY "Admins can update ToS templates" ON tos_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete ToS templates
CREATE POLICY "Admins can delete ToS templates" ON tos_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for package_tos_mappings
ALTER TABLE package_tos_mappings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage package-ToS mappings
CREATE POLICY "Admins can manage package ToS mappings" ON package_tos_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tos_templates
CREATE TRIGGER update_tos_templates_updated_at BEFORE UPDATE ON tos_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for packages
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();