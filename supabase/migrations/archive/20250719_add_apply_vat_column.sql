-- Add apply_vat column to invoices table
-- This allows VAT to be optional on invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS apply_vat BOOLEAN DEFAULT TRUE;

-- Add comment to document the column
COMMENT ON COLUMN public.invoices.apply_vat IS 'Whether to apply 5% VAT to this invoice. Defaults to TRUE for backward compatibility.';
