-- Orders: Stripe checkout session records for offering purchases
create table if not exists orders (
  id                          uuid primary key default gen_random_uuid(),
  offering_id                 uuid references offerings(id) on delete set null,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  customer_email              text,
  customer_name               text,
  amount_cents                integer,
  currency                    text,
  status                      text not null default 'pending'
                              check (status in ('pending', 'paid', 'failed', 'refunded')),
  promo_code                  text,
  metadata                    jsonb,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists orders_status_created on orders (status, created_at desc);
create index if not exists orders_session on orders (stripe_checkout_session_id);

-- Auto-update updated_at
create or replace function update_orders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
  before update on orders
  for each row execute function update_orders_updated_at();

-- RLS: only admins can read orders; webhook uses service role key (bypasses RLS)
alter table orders enable row level security;

drop policy if exists "admins can read orders" on orders;

create policy "admins can read orders"
  on orders for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
