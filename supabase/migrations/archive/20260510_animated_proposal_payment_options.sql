-- Optional free-form payment-options copy for the Investment section.
-- When set, it replaces the auto-generated "First milestone: $X" line on the
-- public proposal viewer, allowing reps to express dual-pricing options
-- (e.g. "$6,000 in 2 payments or $5,000 upfront in full").
alter table public.animated_proposals
  add column if not exists payment_options_text text;
