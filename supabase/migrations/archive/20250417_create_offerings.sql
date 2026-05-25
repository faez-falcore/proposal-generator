-- Offerings: fixed, shareable product pages (separate from admin-built proposals)
create table if not exists offerings (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  kind            text not null check (kind in ('content', 'campaign')),
  name            text not null,
  tagline         text,
  description     text,
  price_cents     integer not null default 0,
  currency        text not null default 'USD',
  video_count     integer,          -- content bundles only
  duration_months integer,          -- campaign tiers only
  features        jsonb not null default '[]',
  hero_media_url  text,
  hero_media_type text check (hero_media_type in ('video', 'image')),
  stripe_price_id text,
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists offerings_active_sort on offerings (is_active, sort_order);

-- Auto-update updated_at
create or replace function update_offerings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_offerings_updated_at on offerings;
create trigger set_offerings_updated_at
  before update on offerings
  for each row execute function update_offerings_updated_at();

-- RLS
alter table offerings enable row level security;

drop policy if exists "public can read active offerings" on offerings;
drop policy if exists "admins can do everything on offerings" on offerings;

create policy "public can read active offerings"
  on offerings for select
  using (is_active = true);

create policy "admins can do everything on offerings"
  on offerings for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Seed six placeholder offerings
insert into offerings (slug, kind, name, tagline, description, price_cents, currency, video_count, duration_months, features, sort_order)
values

  (
    'content-2-videos', 'content', '2 Video Ads', 'Perfect for testing the waters',
    'Two high-quality AI-powered video ads crafted for your brand. Great for A/B testing creatives.',
    0, 'USD', 2, null,
    '[{"title":"2 professional video ads","description":"Scripted, produced, and delivered"},{"title":"1 revision round","description":"We''ll fine-tune until you''re satisfied"},{"title":"Formats for Meta, TikTok & YouTube","description":"Platform-optimized exports"},{"title":"7-day delivery","description":"Fast turnaround"}]',
    10
  ),
  (
    'content-5-videos', 'content', '5 Video Ads', 'Build a creative library',
    'Five conversion-optimised video ads built with AI. Enough creative variety to run full-funnel campaigns.',
    0, 'USD', 5, null,
    '[{"title":"5 professional video ads","description":"Scripted, produced, and delivered"},{"title":"2 revision rounds","description":"Per video"},{"title":"Formats for Meta, TikTok & YouTube","description":"Platform-optimized exports"},{"title":"10-day delivery","description":"Batch delivery"},{"title":"Creative brief session","description":"45-min strategy call included"}]',
    20
  ),
  (
    'content-10-videos', 'content', '10 Video Ads', 'Full creative dominance',
    'Ten video ads for brands that want to dominate the feed. Our best-value content package.',
    0, 'USD', 10, null,
    '[{"title":"10 professional video ads","description":"Scripted, produced, and delivered"},{"title":"Unlimited revisions","description":"Until you''re 100% happy"},{"title":"Formats for Meta, TikTok & YouTube","description":"Platform-optimized exports"},{"title":"14-day delivery","description":"Batch delivery with preview checkpoints"},{"title":"Creative strategy session","description":"60-min deep-dive included"},{"title":"Usage rights forever","description":"Full ownership of every asset"}]',
    30
  ),
  (
    'campaign-1-month', 'campaign', '1-Month Campaign', 'Launch fast, learn fast',
    'One month of end-to-end ad campaign management. We handle creative, copy, audience targeting, and optimisation.',
    0, 'USD', null, 1,
    '[{"title":"Campaign strategy & setup","description":"Audience research, funnel planning"},{"title":"Ad creative production","description":"Up to 4 video ads"},{"title":"Full ad management","description":"Meta and/or TikTok Ads"},{"title":"Weekly performance reports","description":"Transparent dashboard access"},{"title":"Dedicated account manager","description":"Direct WhatsApp/Slack line"}]',
    40
  ),
  (
    'campaign-3-months', 'campaign', '3-Month Campaign', 'Scale what works',
    'Three months of managed advertising with iterative creative and data-led scaling.',
    0, 'USD', null, 3,
    '[{"title":"Everything in 1-Month","description":"Plus three-month volume discounts"},{"title":"Monthly creative refresh","description":"New ads each month based on data"},{"title":"A/B testing framework","description":"Systematic creative experimentation"},{"title":"Bi-weekly strategy calls","description":"30-min review and planning sessions"},{"title":"Retargeting campaigns","description":"Full-funnel coverage"}]',
    50
  ),
  (
    'campaign-6-months', 'campaign', '6-Month Campaign', 'Compound growth, locked in',
    'Our flagship engagement. Six months of creative-led performance advertising with everything we have.',
    0, 'USD', null, 6,
    '[{"title":"Everything in 3-Month","description":"Plus long-term optimisation compounding"},{"title":"Unlimited creative production","description":"As many ads as the strategy demands"},{"title":"Weekly strategy calls","description":"Deep-dive performance sessions"},{"title":"Dedicated creative team","description":"Art director + copywriter assigned"},{"title":"Influencer UGC integration","description":"Real creators, real social proof"},{"title":"Priority support","description":"Same-day response, always"}]',
    60
  )
on conflict (slug) do nothing;
