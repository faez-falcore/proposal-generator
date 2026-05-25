-- Animated personalized proposals table
create table public.animated_proposals (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  slug text unique not null,
  status text not null default 'draft'
    check (status in ('draft','pending_approval','approved','sent','client_signed','counter_signed','paid','archived')),
  brand text not null default 'xma_media'
    check (brand in ('xma','xma_media')),
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,

  client_first_name text not null,
  client_full_name text not null,
  company_name text not null,
  project_title text not null,
  provider_name text not null,
  agency_name text not null default 'XMA Media',
  proposal_date date not null default current_date,

  intro_paragraph text not null,
  challenge_intro text not null,
  problems jsonb not null,
  solution_intro text not null,
  solutions jsonb not null,

  scope_phase_name text,
  scope_subtitle text,
  scope_items jsonb not null default '[]'::jsonb,

  timeline_nodes jsonb not null default '[]'::jsonb,
  retainer_bullets jsonb not null default '[]'::jsonb,

  total_price_cents bigint not null,
  milestone_cents bigint,
  retainer_price_cents bigint,
  currency text not null default 'AED',
  total_days int,

  guarantee_text text,
  phase_two_teaser text,
  terms jsonb not null default '[]'::jsonb,

  stripe_link text,
  stripe_payment_intent_id text,

  client_signature_url text,
  client_signed_at timestamptz,
  provider_signature_url text,
  provider_signed_at timestamptz,
  signed_pdf_url text,

  expires_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Analytics events table
create table public.animated_proposal_events (
  id bigserial primary key,
  proposal_id uuid not null references public.animated_proposals(id) on delete cascade,
  event_type text not null
    check (event_type in ('view','scroll_complete','sign_start','sign_submit','stripe_click')),
  meta jsonb,
  ip inet,
  ua text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.animated_proposals enable row level security;
alter table public.animated_proposal_events enable row level security;

-- Reps see own; admins see all
create policy ap_select on public.animated_proposals for select
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy ap_insert on public.animated_proposals for insert
  with check (created_by = auth.uid());

create policy ap_update on public.animated_proposals for update
  using (
    (created_by = auth.uid() and status in ('draft', 'pending_approval'))
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy ap_delete on public.animated_proposals for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Events: accessible if you can see the proposal
create policy ape_select on public.animated_proposal_events for select
  using (
    exists (
      select 1 from public.animated_proposals p
      where p.id = proposal_id
        and (
          p.created_by = auth.uid()
          or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        )
    )
  );

-- Public read via security-definer RPC (token-gated, status-gated)
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

-- Auto-update updated_at
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

-- Indexes
create index on public.animated_proposals(created_by);
create index on public.animated_proposals(status);
create index on public.animated_proposals(token);
create index on public.animated_proposal_events(proposal_id, event_type);
