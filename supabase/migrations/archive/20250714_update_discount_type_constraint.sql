-- Drop the existing constraint
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_discount_type_check;

-- Add the updated constraint that accepts 'absolute' instead of 'fixed'
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_discount_type_check 
CHECK (discount_type IN ('percentage', 'absolute'));

-- Update any existing 'fixed' values to 'absolute'
UPDATE public.invoices 
SET discount_type = 'absolute' 
WHERE discount_type = 'fixed';

-- Update the index (drop and recreate for consistency)
DROP INDEX IF EXISTS idx_invoices_discount_type;
CREATE INDEX idx_invoices_discount_type ON public.invoices(discount_type);