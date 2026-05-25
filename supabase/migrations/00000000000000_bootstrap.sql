-- =============================================================================
-- XMA Proposal Generator — Animated-Only Bootstrap
-- =============================================================================
-- Tables: profiles, packages, package_features, tos_templates,
--         package_tos_mappings, animated_proposals, animated_proposal_events
-- Storage: signatures bucket
-- RLS: all tables
-- =============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger function
-- ---------------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- profiles
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  name         text,
  avatar_url   text,
  role         text check (role in ('admin', 'sales_rep', 'deactivated')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

-- packages
create table public.packages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price       numeric(10,2) not null,
  currency    text default 'AED',
  description text,
  is_popular  boolean default false,
  usd_price   numeric(10,2),
  brand       text not null default 'xma' check (brand in ('xma', 'xma_media')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_packages_brand on public.packages(brand);

-- package_features
create table public.package_features (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid references public.packages(id) on delete cascade,
  text        text not null,
  order_index int not null,
  is_bold     boolean default false,
  is_included boolean default true
);

create index idx_package_features_package_id on public.package_features(package_id);

-- tos_templates
create table public.tos_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  payment_type text check (payment_type in ('full', 'split', 'custom')),
  terms        jsonb not null default '[]'::jsonb,
  variables    jsonb default '{}'::jsonb,
  is_active    boolean default true,
  brand        text not null default 'xma' check (brand in ('xma', 'xma_media')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  created_by   uuid references auth.users(id)
);

create index idx_tos_templates_active       on public.tos_templates(is_active);
create index idx_tos_templates_payment_type on public.tos_templates(payment_type);
create index idx_tos_templates_brand        on public.tos_templates(brand);

-- package_tos_mappings
create table public.package_tos_mappings (
  id              uuid primary key default gen_random_uuid(),
  package_id      uuid references public.packages(id) on delete cascade,
  tos_template_id uuid references public.tos_templates(id) on delete cascade,
  is_default      boolean default false,
  created_at      timestamptz default now(),
  unique(package_id, tos_template_id)
);

create index idx_package_tos_mappings_package  on public.package_tos_mappings(package_id);
create index idx_package_tos_mappings_default  on public.package_tos_mappings(package_id, is_default);

-- animated_proposals
create table public.animated_proposals (
  id                      uuid primary key default gen_random_uuid(),
  token                   text unique not null default replace(gen_random_uuid()::text, '-', ''),
  slug                    text unique not null,
  status                  text not null default 'draft'
    check (status in ('draft','pending_approval','approved','sent','client_signed','counter_signed','paid','archived')),
  brand                   text not null default 'xma_media'
    check (brand in ('xma', 'xma_media')),
  created_by              uuid not null references auth.users(id),
  approved_by             uuid references auth.users(id),
  approved_at             timestamptz,
  archived_at             timestamptz,

  -- package / TOS links (added in guardrails migration)
  package_id              uuid references public.packages(id) on delete set null,
  tos_template_id         uuid references public.tos_templates(id) on delete set null,

  -- client info
  client_first_name       text not null,
  client_full_name        text not null,
  company_name            text not null,
  project_title           text not null,
  provider_name           text not null,
  agency_name             text not null default 'XMA Media',
  proposal_date           date not null default current_date,

  -- narrative
  intro_paragraph         text not null,
  challenge_intro         text not null,
  problems                jsonb not null,
  solution_intro          text not null,
  solutions               jsonb not null,

  -- scope
  scope_phase_name        text,
  scope_subtitle          text,
  scope_items             jsonb not null default '[]'::jsonb,

  -- timeline / investment
  timeline_nodes          jsonb not null default '[]'::jsonb,
  retainer_bullets        jsonb not null default '[]'::jsonb,
  total_price_cents       bigint not null,
  milestone_cents         bigint,
  retainer_price_cents    bigint,
  currency                text not null default 'AED',
  total_days              int,
  payment_options_text    text,

  -- extras
  guarantee_text          text,
  phase_two_teaser        text,
  terms                   jsonb not null default '[]'::jsonb,

  -- stripe
  stripe_link             text,
  stripe_payment_intent_id text,

  -- order tracking
  order_id                text,

  -- signatures
  client_signature_url    text,
  client_signed_at        timestamptz,
  provider_signature_url  text,
  provider_signed_at      timestamptz,
  signed_pdf_url          text,

  expires_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index on public.animated_proposals(created_by);
create index on public.animated_proposals(status);
create index on public.animated_proposals(token);
create index animated_proposals_package_id_idx     on public.animated_proposals(package_id);
create index animated_proposals_tos_template_id_idx on public.animated_proposals(tos_template_id);
create index animated_proposals_order_id_idx        on public.animated_proposals(order_id);

-- animated_proposal_events
create table public.animated_proposal_events (
  id          bigserial primary key,
  proposal_id uuid not null references public.animated_proposals(id) on delete cascade,
  event_type  text not null
    check (event_type in ('view','scroll_complete','sign_start','sign_submit','stripe_click')),
  meta        jsonb,
  ip          inet,
  ua          text,
  created_at  timestamptz not null default now()
);

create index on public.animated_proposal_events(proposal_id, event_type);

-- ---------------------------------------------------------------------------
-- TRIGGERS  (updated_at)
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger packages_updated_at
  before update on public.packages
  for each row execute function public.update_updated_at_column();

create trigger tos_templates_updated_at
  before update on public.tos_templates
  for each row execute function public.update_updated_at_column();

create or replace function public.set_animated_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger animated_proposals_updated_at
  before update on public.animated_proposals
  for each row execute function public.set_animated_updated_at();

-- ---------------------------------------------------------------------------
-- AUTH TRIGGER — auto-create profile row on signup
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'sales_rep');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
end;
$$;

create or replace function public.is_sales_rep()
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'sales_rep'
  );
end;
$$;

create or replace function public.get_user_role()
returns text language plpgsql security definer as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles
  where id = (select auth.uid());
  return v_role;
end;
$$;

-- ---------------------------------------------------------------------------
-- PUBLIC RPC — token-gated read (used by /proposal/[token] page)
-- ---------------------------------------------------------------------------
create or replace function public.get_animated_by_token(p_token text)
returns setof public.animated_proposals
language sql security definer stable as $$
  select * from public.animated_proposals
  where token = p_token
    and status in ('approved','sent','client_signed','counter_signed','paid')
    and (expires_at is null or expires_at > now())
    and archived_at is null;
$$;

grant execute on function public.get_animated_by_token(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS — enable on all tables
-- ---------------------------------------------------------------------------

alter table public.profiles                enable row level security;
alter table public.packages                enable row level security;
alter table public.package_features        enable row level security;
alter table public.tos_templates           enable row level security;
alter table public.package_tos_mappings    enable row level security;
alter table public.animated_proposals      enable row level security;
alter table public.animated_proposal_events enable row level security;

-- --- profiles ---------------------------------------------------------------

-- Users read own profile; admins read all
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    or (select public.is_admin())
  );

-- Users update own profile; admins update any
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_update_admin_all" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Admins can insert new profiles (when creating sales reps manually)
-- Handle_new_user trigger uses SECURITY DEFINER (bypasses RLS), so no policy needed for trigger inserts
create policy "profiles_insert_admin" on public.profiles
  for insert to authenticated
  with check (
    (select public.is_admin())
    or (select auth.uid()) = id
  );

-- Only admins can delete profiles
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using ((select public.is_admin()));

-- --- packages ---------------------------------------------------------------

create policy "packages_select" on public.packages
  for select to authenticated
  using (true);

create policy "packages_insert_admin" on public.packages
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "packages_update_admin" on public.packages
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "packages_delete_admin" on public.packages
  for delete to authenticated
  using ((select public.is_admin()));

-- --- package_features -------------------------------------------------------

create policy "package_features_select" on public.package_features
  for select to authenticated
  using (true);

create policy "package_features_insert_admin" on public.package_features
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "package_features_update_admin" on public.package_features
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "package_features_delete_admin" on public.package_features
  for delete to authenticated
  using ((select public.is_admin()));

-- --- tos_templates ----------------------------------------------------------

create policy "tos_templates_select" on public.tos_templates
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.is_sales_rep())
  );

create policy "tos_templates_insert_admin" on public.tos_templates
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "tos_templates_update_admin" on public.tos_templates
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "tos_templates_delete_admin" on public.tos_templates
  for delete to authenticated
  using ((select public.is_admin()));

-- --- package_tos_mappings ---------------------------------------------------

create policy "package_tos_mappings_select" on public.package_tos_mappings
  for select to authenticated
  using (
    (select public.is_admin())
    or (select public.is_sales_rep())
  );

create policy "package_tos_mappings_admin" on public.package_tos_mappings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- --- animated_proposals -----------------------------------------------------

-- Creator or any admin/sales_rep can read
create policy "ap_select" on public.animated_proposals
  for select to authenticated
  using (
    (select auth.uid()) = created_by
    or (select public.is_admin())
    or (select public.is_sales_rep())
  );

create policy "ap_insert" on public.animated_proposals
  for insert to authenticated
  with check ((select auth.uid()) = created_by);

-- Admin/sales_rep can update any; creator can update own draft/pending
create policy "ap_update" on public.animated_proposals
  for update to authenticated
  using (
    (select public.is_admin())
    or (select public.is_sales_rep())
    or (
      (select auth.uid()) = created_by
      and status in ('draft', 'pending_approval')
    )
  )
  with check (
    (select public.is_admin())
    or (select public.is_sales_rep())
    or (
      (select auth.uid()) = created_by
      and status in ('draft', 'pending_approval')
    )
  );

create policy "ap_delete" on public.animated_proposals
  for delete to authenticated
  using ((select public.is_admin()));

-- --- animated_proposal_events -----------------------------------------------

-- Admin/sales_rep/creator can read events; inserts via service role only
create policy "ape_select" on public.animated_proposal_events
  for select to authenticated
  using (
    exists (
      select 1 from public.animated_proposals p
      where p.id = proposal_id
        and (
          p.created_by = (select auth.uid())
          or (select public.is_admin())
          or (select public.is_sales_rep())
        )
    )
  );

-- Service role inserts events (bypasses RLS) — no anon insert policy needed

-- ---------------------------------------------------------------------------
-- STORAGE — signatures bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

create policy "public_read_signatures" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'signatures');

create policy "authenticated_upload_signatures" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'signatures');

create policy "owner_update_signatures" on storage.objects
  for update to authenticated
  using (bucket_id = 'signatures' and (select auth.uid()) = owner)
  with check (bucket_id = 'signatures');

create policy "owner_delete_signatures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'signatures' and (select auth.uid()) = owner);

-- ---------------------------------------------------------------------------
-- SEED DATA — TOS templates
-- (created_by = NULL; will be updated by seed-admin if needed)
-- ---------------------------------------------------------------------------

insert into public.tos_templates (name, description, payment_type, terms, brand, created_by)
values (
  'Standard Full Payment',
  'Standard terms requiring 100% upfront payment',
  'full',
  '[
    {"id": 1, "title": "Payment Terms", "content": "100% payment required upfront to initiate the project.", "order": 1},
    {"id": 2, "title": "Revisions", "content": "Package includes up to 3 rounds of revisions for each deliverable.", "order": 2},
    {"id": 3, "title": "Timeline", "content": "Estimated completion time is 4-6 weeks from project start date, dependent on client feedback turnaround times.", "order": 3},
    {"id": 4, "title": "Content", "content": "Client is responsible for providing necessary content (brand asset, product information, account credentials etc.) within 3 days of project start.", "order": 4},
    {"id": 5, "title": "Intellectual Property", "content": "Upon full payment, client receives full rights to all deliverables created specifically for this project.", "order": 5},
    {"id": 6, "title": "Cancellation and Satisfaction Guarantee", "content": "We offer a satisfaction guarantee for up to one month after campaign launch.", "order": 6},
    {"id": 7, "title": "Confidentiality", "content": "XMA Agency agrees to maintain confidentiality of all client information.", "order": 7},
    {"id": 8, "title": "Additional Services", "content": "Any services not specified in this proposal will require a separate agreement.", "order": 8},
    {"id": 9, "title": "Commencement of Ad Management", "content": "The initial ad management period (1 month) will begin once all essential assets have been delivered and approved.", "order": 9},
    {"id": 10, "title": "Advertising Platforms", "content": "XMA Agency can manage advertising across any major platform.", "order": 10},
    {"id": 11, "title": "Ad Spend Handling", "content": "All payments for ad spend will be made directly by the client through their own advertising account(s).", "order": 11},
    {"id": 12, "title": "Governing Law", "content": "This agreement is governed by the laws of the United Arab Emirates.", "order": 12}
  ]'::jsonb,
  'xma',
  null
);

insert into public.tos_templates (name, description, payment_type, terms, brand, created_by)
values (
  'Split Payment 50/50',
  'Terms for 50% upfront and 50% on delivery payment structure',
  'split',
  '[
    {"id": 1, "title": "Payment Terms", "content": "50% payment required upfront to initiate the project. Remaining 50% due upon delivery.", "order": 1},
    {"id": 2, "title": "Revisions", "content": "Package includes up to 3 rounds of revisions for each deliverable.", "order": 2},
    {"id": 3, "title": "Timeline", "content": "Estimated completion time is 4-6 weeks from project start date.", "order": 3},
    {"id": 4, "title": "Content", "content": "Client is responsible for providing necessary content within 3 days of project start.", "order": 4},
    {"id": 5, "title": "Intellectual Property", "content": "Upon full payment completion, client receives full rights to all deliverables.", "order": 5},
    {"id": 6, "title": "Confidentiality", "content": "XMA Agency agrees to maintain confidentiality of all client information.", "order": 6},
    {"id": 7, "title": "Additional Services", "content": "Any services not specified in this proposal will require a separate agreement.", "order": 7},
    {"id": 8, "title": "Governing Law", "content": "This agreement is governed by the laws of the United Arab Emirates.", "order": 8}
  ]'::jsonb,
  'xma',
  null
);

insert into public.tos_templates (name, description, payment_type, terms, brand, created_by)
values (
  'XMA Media — Monthly Retainer',
  'Terms for XMA Media content production and paid advertising management services on a monthly recurring basis',
  'custom',
  '[
    {"id": 1, "title": "Scope of Services", "content": "XMA Media provides content production and paid advertising management services, including:\n- Creation of up to 10 ad-ready video creatives (30-60 seconds) per month\n- Management of one (1) advertising account\n- Campaign setup, testing, and ongoing optimization\n- Weekly performance reporting\n- Bi-weekly strategy calls", "order": 1},
    {"id": 2, "title": "Payment Terms", "content": "Fees are billed monthly in advance. Work will commence upon receipt of the first payment. Payments are non-refundable, except where explicitly stated in the Guarantee clause.", "order": 2},
    {"id": 3, "title": "Onboarding & Timeline", "content": "Initial onboarding and strategy setup will be completed within 7-14 days of project start.", "order": 3},
    {"id": 4, "title": "Client Responsibilities", "content": "The client agrees to provide all necessary assets, timely feedback, and maintain an active minimum ad spend as agreed.", "order": 4},
    {"id": 5, "title": "Advertising Spend", "content": "The client is solely responsible for funding all advertising spend directly on platforms.", "order": 5},
    {"id": 6, "title": "Performance Disclaimer", "content": "XMA Media does not guarantee specific results. Performance depends on multiple external factors.", "order": 6},
    {"id": 7, "title": "Intellectual Property", "content": "Upon full payment, the client receives full usage rights to all delivered creatives.", "order": 7},
    {"id": 8, "title": "Term & Termination", "content": "Either party may terminate with 30 days written notice. No refunds for partially used billing periods.", "order": 8},
    {"id": 9, "title": "14-Day Performance Guarantee", "content": "If the client is not satisfied within 14 days of campaign launch, they may request a refund subject to qualifying conditions.", "order": 9},
    {"id": 10, "title": "Confidentiality", "content": "Both parties agree to maintain confidentiality of all proprietary information.", "order": 10},
    {"id": 11, "title": "Governing Law", "content": "This agreement is governed by the laws of the United Arab Emirates.", "order": 11}
  ]'::jsonb,
  'xma_media',
  null
);
