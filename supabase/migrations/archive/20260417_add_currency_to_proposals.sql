alter table proposals
  add column if not exists currency text not null default 'AED'
  check (currency in ('AED', 'USD', 'EUR', 'GBP'));
