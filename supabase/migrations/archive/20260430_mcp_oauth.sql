create table public.mcp_oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  redirect_uris text[] not null,
  client_name text,
  created_at timestamptz not null default now()
);

create table public.mcp_oauth_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table public.mcp_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  token_prefix text not null,
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index mcp_oauth_codes_code_idx on public.mcp_oauth_codes(code) where used_at is null;
create index mcp_oauth_tokens_hash_idx on public.mcp_oauth_tokens(token_hash) where revoked_at is null;

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes enable row level security;
alter table public.mcp_oauth_tokens enable row level security;
