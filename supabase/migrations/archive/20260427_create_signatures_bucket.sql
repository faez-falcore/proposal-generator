insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

create policy "Service role full access on signatures"
  on storage.objects
  for all
  using (bucket_id = 'signatures')
  with check (bucket_id = 'signatures');
