-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  
  -- Company (Issuer) Information
  issuer_name TEXT NOT NULL DEFAULT 'XLUXIVE DIGITAL MARKETING LLC',
  issuer_address TEXT NOT NULL,
  issuer_phone TEXT NOT NULL,
  issuer_trn TEXT NOT NULL DEFAULT '104853792000003',
  
  -- Client (Bill To) Information
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_trn TEXT,
  
  -- Invoice Details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  
  -- Service/Product Details (stored as JSON)
  line_items JSONB NOT NULL,
  
  -- Payment Information
  bank_account_holder TEXT NOT NULL DEFAULT 'XLUXIVE DIGITAL MARKETING LLC',
  iban TEXT NOT NULL,
  swift_code TEXT NOT NULL,
  bank_address TEXT NOT NULL,
  
  -- Calculations
  subtotal DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status and Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_proposal_id ON public.invoices(proposal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Create RLS policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Only admins can create, view, update, and delete invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Admins can manage invoices'
  ) THEN
    CREATE POLICY "Admins can manage invoices" ON public.invoices
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Create sequence for invoice numbering
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1000;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  seq_part := LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
  RETURN 'INV-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
