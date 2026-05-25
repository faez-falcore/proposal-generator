-- Add payment tracking fields
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add recurring invoice fields
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT CHECK (recurring_interval IN ('monthly', 'quarterly', 'annually')),
ADD COLUMN IF NOT EXISTS recurring_start_date DATE,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE,
ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Create table for recurring invoice templates
CREATE TABLE IF NOT EXISTS public.recurring_invoice_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_trn TEXT,
  line_items JSONB NOT NULL,
  recurring_interval TEXT NOT NULL CHECK (recurring_interval IN ('monthly', 'quarterly', 'annually')),
  next_invoice_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for recurring templates
ALTER TABLE public.recurring_invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurring templates" ON public.recurring_invoice_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Drop old sequence and function
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP SEQUENCE IF EXISTS invoice_number_seq;

-- Create new function for monthly invoice numbering
CREATE OR REPLACE FUNCTION generate_monthly_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  month_part TEXT;
  seq_part TEXT;
  last_number INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  month_part := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Get the last invoice number for this month
  SELECT 
    COALESCE(
      MAX(
        CAST(
          SUBSTRING(invoice_number FROM 'INV-\d{4}-\d{2}-(\d{4})')
          AS INTEGER
        )
      ), 
      0
    ) INTO last_number
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-' || month_part || '-%';
  
  seq_part := LPAD((last_number + 1)::TEXT, 4, '0');
  
  RETURN 'INV-' || year_part || '-' || month_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_payment_date ON public.invoices(payment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_is_recurring ON public.invoices(is_recurring);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_next_date ON public.recurring_invoice_templates(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_is_active ON public.recurring_invoice_templates(is_active);

-- Update trigger for recurring templates
CREATE TRIGGER update_recurring_templates_updated_at
  BEFORE UPDATE ON public.recurring_invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();