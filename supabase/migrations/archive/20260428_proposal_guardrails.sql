-- Add brand column to tos_templates for direct brand-affinity filtering
alter table tos_templates
  add column if not exists brand text not null default 'xma'
  check (brand in ('xma', 'xma_media'));

-- Link animated_proposals to the package catalog and T&C library
alter table animated_proposals
  add column if not exists package_id uuid references packages(id) on delete set null,
  add column if not exists tos_template_id uuid references tos_templates(id) on delete set null;

create index if not exists animated_proposals_package_id_idx on animated_proposals(package_id);
create index if not exists animated_proposals_tos_template_id_idx on animated_proposals(tos_template_id);

-- Backfill brand on the seeded XMA Media template
update tos_templates set brand = 'xma_media' where name ilike '%xma media%';
