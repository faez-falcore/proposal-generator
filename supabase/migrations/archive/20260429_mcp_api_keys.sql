create table public.mcp_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index mcp_api_keys_user_id_idx on public.mcp_api_keys(user_id);
create index mcp_api_keys_key_hash_idx on public.mcp_api_keys(key_hash) where revoked_at is null;

alter table public.mcp_api_keys enable row level security;

create policy "users see own keys" on public.mcp_api_keys
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "users insert own keys" on public.mcp_api_keys
  for insert with check (user_id = auth.uid());

create policy "users revoke own keys" on public.mcp_api_keys
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
