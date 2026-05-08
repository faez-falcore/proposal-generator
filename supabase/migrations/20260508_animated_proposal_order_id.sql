alter table animated_proposals
  add column if not exists order_id text;

create index if not exists animated_proposals_order_id_idx on animated_proposals (order_id);
