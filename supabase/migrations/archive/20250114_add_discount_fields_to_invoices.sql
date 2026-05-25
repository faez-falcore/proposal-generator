-- Add discount fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create index for discount fields
CREATE INDEX IF NOT EXISTS idx_invoices_discount_type ON public.invoices(discount_type);
