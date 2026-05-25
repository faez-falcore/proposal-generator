alter table packages
  add column if not exists brand text not null default 'xma'
  check (brand in ('xma', 'xma_media'));

create index if not exists idx_packages_brand
  on packages (brand);
