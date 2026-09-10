-- Visual property mode: room/property photos and clickable hotspots on them.
-- Extends `attachments` (a photo is still just a file with an owner) rather
-- than inventing a parallel media system, and reuses `assets`/`records` as
-- the thing a hotspot points to and its history, instead of a new
-- materials/components system -- see docs/decisions/0006-visual-mode-reuses-assets-and-records.md.

-- No separate thumbnail/variant column: Supabase Storage's image-transform
-- API is Pro-plan only (confirmed against current docs -- unavailable on
-- this project's free tier), so photos are downscaled client-side to one
-- reasonable display size before upload (matching the existing OCR-photo
-- pattern in src/lib/image.ts) rather than stored at multiple sizes.
-- `loading="lazy"` on the <img> tags covers the rest for now; a real
-- separate thumbnail is a later optimization if usage ever shows it's
-- needed, not a day-one requirement.
alter table attachments
  add column space_id uuid references spaces (id) on delete cascade,
  add column role text not null default 'document' check (role in ('document', 'photo')),
  add column is_cover boolean not null default false,
  add column width_px int check (width_px is null or width_px > 0),
  add column height_px int check (height_px is null or height_px > 0);

alter table attachments drop constraint attachments_single_owner;
alter table attachments add constraint attachments_single_owner
  check (num_nonnulls(property_id, asset_id, record_id, warranty_id, space_id) = 1);

create index attachments_space_id_idx on attachments (space_id);

-- At most one cover photo per owner (the hero/thumbnail image) -- a real
-- invariant worth enforcing in the database, not just in application code,
-- since a double-click or two open tabs could otherwise race two covers
-- into existence.
create unique index attachments_one_cover_per_property on attachments (property_id) where is_cover and property_id is not null;
create unique index attachments_one_cover_per_space on attachments (space_id) where is_cover and space_id is not null;
create unique index attachments_one_cover_per_asset on attachments (asset_id) where is_cover and asset_id is not null;

-- Clickable regions on a photo (attachments.role = 'photo'), each optionally
-- pointing at an existing asset. Deliberately NOT a new "materials" or
-- "components" system: a wall's paint job, a cabinet, a furnace, and a roof
-- are all already `assets` (manufacturer/model/serial/installed/cost/vendor
-- already fit every one of them), and an asset's history is already
-- `records` scoped to that asset_id (see ADR 0005). This table only stores
-- *where the pin sits on the photo*, never what's true about the thing it
-- points to -- keeps "delete this pin" and "delete this asset" genuinely
-- separate operations.
create table visual_annotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  attachment_id uuid not null references attachments (id) on delete cascade,
  asset_id uuid references assets (id) on delete cascade,
  annotation_type text not null check (annotation_type in ('point', 'rectangle', 'polygon')),
  -- Normalized (0-1) coordinates relative to the photo's own width/height,
  -- so a hotspot stays aligned regardless of what size the photo is
  -- displayed at. Shape depends on annotation_type:
  --   point:     {"x":0.42,"y":0.18}
  --   rectangle: {"x":0.10,"y":0.20,"w":0.30,"h":0.15}
  --   polygon:   {"points":[[0.1,0.2],[0.4,0.2],[0.4,0.5],[0.1,0.5]]}
  coordinates jsonb not null,
  label text not null check (char_length(trim(label)) > 0),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index visual_annotations_organization_id_idx on visual_annotations (organization_id);
create index visual_annotations_attachment_id_idx on visual_annotations (attachment_id);
create index visual_annotations_asset_id_idx on visual_annotations (asset_id);

create trigger visual_annotations_set_updated_at before update on visual_annotations
  for each row execute function set_updated_at();

alter table visual_annotations enable row level security;
create policy visual_annotations_select_members on visual_annotations for select using (is_org_member(organization_id));
create policy visual_annotations_insert_members on visual_annotations for insert with check (is_org_member(organization_id));
create policy visual_annotations_update_members on visual_annotations for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy visual_annotations_delete_members on visual_annotations for delete using (is_org_member(organization_id));

-- A wall's paint, cabinets, and tile are physical, trackable things just
-- like a furnace or dishwasher -- same `assets` table, just two category
-- kinds that didn't exist yet (roofing/exterior/flooring/painting already did).
insert into asset_categories (organization_id, key, label) values
  (null, 'cabinetry', 'Cabinetry'),
  (null, 'tile', 'Tile')
on conflict do nothing;
