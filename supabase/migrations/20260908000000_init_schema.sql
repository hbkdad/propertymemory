-- Property Memory: initial schema.
-- Every table ships enabled RLS + policies in this same migration (CLAUDE.md rule).
-- organization_id is denormalized onto every tenant table (not just derived via
-- parent joins) so each RLS policy is a single membership check, not a multi-level
-- join -- this is the standard Supabase pattern for keeping RLS both simple and fast.

-- ============================================================
-- 1. Extensions
-- ============================================================
create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()
create extension if not exists pg_trgm;    -- trigram indexes for global search

-- ============================================================
-- 2. Core identity tables
--    (organizations and memberships are created together because the RLS
--    helper functions below need memberships to exist, and memberships
--    needs organizations to exist as a foreign key -- so RLS for these two
--    is applied after the helper functions, in section 4, not inline.)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index memberships_organization_id_idx on memberships (organization_id);
create index memberships_user_id_idx on memberships (user_id);

-- ============================================================
-- 3. Helper functions
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- security definer + fixed search_path: without this, the RLS policies on
-- memberships (below) would need to call is_org_member, which queries
-- memberships, which is itself RLS-protected by a policy that calls
-- is_org_member -- a circular check. Running as definer (table owner)
-- bypasses RLS for this internal lookup only; the function still only ever
-- answers "is the *current* auth.uid() a member of this org", so it leaks
-- nothing.
create or replace function is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function is_org_member(uuid) from public;
revoke all on function is_org_admin(uuid) from public;
grant execute on function is_org_member(uuid) to authenticated;
grant execute on function is_org_admin(uuid) to authenticated;

-- Bootstraps an organization and its owner membership atomically, sidestepping
-- the chicken-and-egg problem where a freshly-inserted organization would be
-- invisible to its own creator under RLS until a membership row exists.
--
-- Call this as `select * from create_organization('name')` (or via Supabase's
-- .rpc(), which calls it the same way) -- NOT as `select (create_organization('name')).id`.
-- Verified locally: the dot-notation composite-field-extraction form makes
-- Postgres invoke this function twice per call, silently creating two
-- organizations. The FROM-clause form (and .rpc()) invokes it exactly once.
create or replace function create_organization(p_name text)
returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org organizations;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into organizations (name, created_by)
  values (p_name, auth.uid())
  returning * into v_org;

  insert into memberships (organization_id, user_id, role)
  values (v_org.id, auth.uid(), 'owner');

  return v_org;
end;
$$;

revoke all on function create_organization(text) from public;
grant execute on function create_organization(text) to authenticated;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 4. RLS for core identity tables
-- ============================================================

create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;
-- Profiles hold no sensitive fields by design (display name + avatar only),
-- so any authenticated user may read any profile (needed to show teammates'
-- names on shared org content); only the owner may edit their own.
create policy profiles_select_all on profiles for select using (true);
create policy profiles_update_self on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();

alter table organizations enable row level security;
create policy organizations_select_members on organizations for select
  using (is_org_member(id));
create policy organizations_update_admins on organizations for update
  using (is_org_admin(id)) with check (is_org_admin(id));
create policy organizations_delete_admins on organizations for delete
  using (is_org_admin(id));
-- No insert policy: organizations are only created via create_organization().

create trigger memberships_set_updated_at before update on memberships
  for each row execute function set_updated_at();

alter table memberships enable row level security;
create policy memberships_select_members on memberships for select
  using (is_org_member(organization_id));
create policy memberships_insert_admins on memberships for insert
  with check (is_org_admin(organization_id));
create policy memberships_update_admins on memberships for update
  using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy memberships_delete_admins on memberships for delete
  using (is_org_admin(organization_id));

-- ============================================================
-- 5. Domain tables (table + indexes + RLS + trigger, inline, per table)
-- ============================================================

-- properties ---------------------------------------------------
create table properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  property_type text not null default 'single_family'
    check (property_type in ('single_family', 'condo', 'multi_unit', 'commercial', 'other')),
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text not null default 'CA',
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_organization_id_idx on properties (organization_id);
create index properties_name_trgm_idx on properties using gin (name gin_trgm_ops);
create index properties_address_trgm_idx on properties using gin (address_line1 gin_trgm_ops);

create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();

alter table properties enable row level security;
create policy properties_select_members on properties for select using (is_org_member(organization_id));
create policy properties_insert_members on properties for insert with check (is_org_member(organization_id));
create policy properties_update_members on properties for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy properties_delete_admins on properties for delete using (is_org_admin(organization_id));

-- units ----------------------------------------------------------
create table units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index units_organization_id_idx on units (organization_id);
create index units_property_id_idx on units (property_id);

create trigger units_set_updated_at before update on units
  for each row execute function set_updated_at();

alter table units enable row level security;
create policy units_select_members on units for select using (is_org_member(organization_id));
create policy units_insert_members on units for insert with check (is_org_member(organization_id));
create policy units_update_members on units for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy units_delete_members on units for delete using (is_org_member(organization_id));

-- spaces -----------------------------------------------------------
create table spaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  unit_id uuid references units (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  space_type text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spaces_organization_id_idx on spaces (organization_id);
create index spaces_property_id_idx on spaces (property_id);
create index spaces_unit_id_idx on spaces (unit_id);

create trigger spaces_set_updated_at before update on spaces
  for each row execute function set_updated_at();

alter table spaces enable row level security;
create policy spaces_select_members on spaces for select using (is_org_member(organization_id));
create policy spaces_insert_members on spaces for insert with check (is_org_member(organization_id));
create policy spaces_update_members on spaces for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy spaces_delete_members on spaces for delete using (is_org_member(organization_id));

-- vendors (also covers "contractors" -- see ADR 0005) ---------------
create table vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  kind text not null default 'vendor' check (kind in ('vendor', 'contractor', 'both')),
  contact_name text,
  phone text,
  email text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_organization_id_idx on vendors (organization_id);
create index vendors_name_trgm_idx on vendors using gin (name gin_trgm_ops);

create trigger vendors_set_updated_at before update on vendors
  for each row execute function set_updated_at();

alter table vendors enable row level security;
create policy vendors_select_members on vendors for select using (is_org_member(organization_id));
create policy vendors_insert_members on vendors for insert with check (is_org_member(organization_id));
create policy vendors_update_members on vendors for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy vendors_delete_members on vendors for delete using (is_org_member(organization_id));

-- asset_categories (global defaults with organization_id null, plus
-- optional org-specific custom categories) --------------------------
create table asset_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  key text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create unique index asset_categories_global_key_idx on asset_categories (key) where organization_id is null;
create unique index asset_categories_org_key_idx on asset_categories (organization_id, key) where organization_id is not null;

alter table asset_categories enable row level security;
create policy asset_categories_select on asset_categories for select
  using (organization_id is null or is_org_member(organization_id));
create policy asset_categories_insert on asset_categories for insert
  with check (organization_id is not null and is_org_member(organization_id));
create policy asset_categories_update on asset_categories for update
  using (organization_id is not null and is_org_member(organization_id))
  with check (organization_id is not null and is_org_member(organization_id));
create policy asset_categories_delete on asset_categories for delete
  using (organization_id is not null and is_org_member(organization_id));

-- assets -----------------------------------------------------------
create table assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  unit_id uuid references units (id) on delete set null,
  space_id uuid references spaces (id) on delete set null,
  asset_category_id uuid references asset_categories (id) on delete set null,
  vendor_id uuid references vendors (id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  manufacturer text,
  model_number text,
  serial_number text,
  location_note text,
  installed_on date,
  purchased_on date,
  purchase_price numeric(12, 2),
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_organization_id_idx on assets (organization_id);
create index assets_property_id_idx on assets (property_id);
create index assets_unit_id_idx on assets (unit_id);
create index assets_space_id_idx on assets (space_id);
create index assets_name_trgm_idx on assets using gin (name gin_trgm_ops);
create index assets_manufacturer_trgm_idx on assets using gin (manufacturer gin_trgm_ops);
create index assets_model_number_trgm_idx on assets using gin (model_number gin_trgm_ops);
create index assets_serial_number_trgm_idx on assets using gin (serial_number gin_trgm_ops);

create trigger assets_set_updated_at before update on assets
  for each row execute function set_updated_at();

alter table assets enable row level security;
create policy assets_select_members on assets for select using (is_org_member(organization_id));
create policy assets_insert_members on assets for insert with check (is_org_member(organization_id));
create policy assets_update_members on assets for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy assets_delete_members on assets for delete using (is_org_member(organization_id));

-- record_types (global defaults + optional org-specific) ------------
create table record_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  key text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create unique index record_types_global_key_idx on record_types (key) where organization_id is null;
create unique index record_types_org_key_idx on record_types (organization_id, key) where organization_id is not null;

alter table record_types enable row level security;
create policy record_types_select on record_types for select
  using (organization_id is null or is_org_member(organization_id));
create policy record_types_insert on record_types for insert
  with check (organization_id is not null and is_org_member(organization_id));
create policy record_types_update on record_types for update
  using (organization_id is not null and is_org_member(organization_id))
  with check (organization_id is not null and is_org_member(organization_id));
create policy record_types_delete on record_types for delete
  using (organization_id is not null and is_org_member(organization_id));

-- records: the flexible timeline entity (see ADR 0005) ---------------
create table records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  unit_id uuid references units (id) on delete set null,
  space_id uuid references spaces (id) on delete set null,
  asset_id uuid references assets (id) on delete set null,
  record_type_id uuid not null references record_types (id),
  vendor_id uuid references vendors (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  occurred_on date not null default current_date,
  cost numeric(12, 2),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- property_id is always the anchor; at most one deeper scope may also be set.
  constraint records_single_scope check (num_nonnulls(unit_id, space_id, asset_id) <= 1)
);

create index records_organization_id_idx on records (organization_id);
create index records_property_id_idx on records (property_id);
create index records_asset_id_idx on records (asset_id);
create index records_record_type_id_idx on records (record_type_id);
create index records_occurred_on_idx on records (occurred_on);
create index records_title_trgm_idx on records using gin (title gin_trgm_ops);

create trigger records_set_updated_at before update on records
  for each row execute function set_updated_at();

alter table records enable row level security;
create policy records_select_members on records for select using (is_org_member(organization_id));
create policy records_insert_members on records for insert with check (is_org_member(organization_id));
create policy records_update_members on records for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy records_delete_members on records for delete using (is_org_member(organization_id));

-- warranties (own table -- see ADR 0005) -----------------------------
create table warranties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  asset_id uuid references assets (id) on delete cascade,
  provider text not null,
  policy_number text,
  claim_reference text,
  starts_on date,
  expires_on date not null,
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index warranties_organization_id_idx on warranties (organization_id);
create index warranties_property_id_idx on warranties (property_id);
create index warranties_asset_id_idx on warranties (asset_id);
create index warranties_expires_on_idx on warranties (expires_on);

create trigger warranties_set_updated_at before update on warranties
  for each row execute function set_updated_at();

alter table warranties enable row level security;
create policy warranties_select_members on warranties for select using (is_org_member(organization_id));
create policy warranties_insert_members on warranties for insert with check (is_org_member(organization_id));
create policy warranties_update_members on warranties for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy warranties_delete_members on warranties for delete using (is_org_member(organization_id));

-- attachments: owner is exactly one of property/asset/record/warranty --
create table attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid references properties (id) on delete cascade,
  asset_id uuid references assets (id) on delete cascade,
  record_id uuid references records (id) on delete cascade,
  warranty_id uuid references warranties (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400), -- 25MB cap
  uploaded_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint attachments_single_owner
    check (num_nonnulls(property_id, asset_id, record_id, warranty_id) = 1)
);

create index attachments_organization_id_idx on attachments (organization_id);
create index attachments_record_id_idx on attachments (record_id);
create index attachments_asset_id_idx on attachments (asset_id);

alter table attachments enable row level security;
create policy attachments_select_members on attachments for select using (is_org_member(organization_id));
create policy attachments_insert_members on attachments for insert with check (is_org_member(organization_id));
create policy attachments_update_members on attachments for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy attachments_delete_members on attachments for delete using (is_org_member(organization_id));

-- expenses -----------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  record_id uuid references records (id) on delete set null,
  vendor_id uuid references vendors (id) on delete set null,
  attachment_id uuid references attachments (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  currency text not null default 'CAD',
  category text not null default 'other'
    check (category in ('maintenance', 'repair', 'renovation', 'supplies', 'other')),
  expense_date date not null default current_date,
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_organization_id_idx on expenses (organization_id);
create index expenses_property_id_idx on expenses (property_id);
create index expenses_expense_date_idx on expenses (expense_date);

create trigger expenses_set_updated_at before update on expenses
  for each row execute function set_updated_at();

alter table expenses enable row level security;
create policy expenses_select_members on expenses for select using (is_org_member(organization_id));
create policy expenses_insert_members on expenses for insert with check (is_org_member(organization_id));
create policy expenses_update_members on expenses for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy expenses_delete_members on expenses for delete using (is_org_member(organization_id));

-- reminders ------------------------------------------------------------
create table reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  asset_id uuid references assets (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  is_recurring boolean not null default false,
  recurrence_interval text
    check (recurrence_interval in ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
  due_on date not null,
  is_active boolean not null default true,
  last_completed_on date,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_recurrence_requires_interval
    check (not is_recurring or recurrence_interval is not null)
);

create index reminders_organization_id_idx on reminders (organization_id);
create index reminders_property_id_idx on reminders (property_id);
create index reminders_due_on_idx on reminders (due_on) where is_active;

create trigger reminders_set_updated_at before update on reminders
  for each row execute function set_updated_at();

alter table reminders enable row level security;
create policy reminders_select_members on reminders for select using (is_org_member(organization_id));
create policy reminders_insert_members on reminders for insert with check (is_org_member(organization_id));
create policy reminders_update_members on reminders for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy reminders_delete_members on reminders for delete using (is_org_member(organization_id));

-- tags + record_tags ----------------------------------------------------
create table tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index tags_organization_id_idx on tags (organization_id);

alter table tags enable row level security;
create policy tags_select_members on tags for select using (is_org_member(organization_id));
create policy tags_insert_members on tags for insert with check (is_org_member(organization_id));
create policy tags_update_members on tags for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy tags_delete_members on tags for delete using (is_org_member(organization_id));

create table record_tags (
  record_id uuid not null references records (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (record_id, tag_id)
);

create index record_tags_organization_id_idx on record_tags (organization_id);

alter table record_tags enable row level security;
create policy record_tags_select_members on record_tags for select using (is_org_member(organization_id));
create policy record_tags_insert_members on record_tags for insert with check (is_org_member(organization_id));
create policy record_tags_delete_members on record_tags for delete using (is_org_member(organization_id));

-- extraction_jobs (smart capture / OCR provenance) ------------------------
create table extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  kind text not null check (kind in ('receipt', 'appliance_label', 'paint_can', 'invoice')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  provider text not null,
  input_attachment_id uuid references attachments (id) on delete set null,
  raw_result jsonb,
  confidence numeric(4, 3),
  error_message text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index extraction_jobs_organization_id_idx on extraction_jobs (organization_id);

create trigger extraction_jobs_set_updated_at before update on extraction_jobs
  for each row execute function set_updated_at();

alter table extraction_jobs enable row level security;
create policy extraction_jobs_select_members on extraction_jobs for select using (is_org_member(organization_id));
create policy extraction_jobs_insert_members on extraction_jobs for insert with check (is_org_member(organization_id));
create policy extraction_jobs_update_members on extraction_jobs for update
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));
create policy extraction_jobs_delete_members on extraction_jobs for delete using (is_org_member(organization_id));

-- audit_events (append-only) ------------------------------------------------
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_organization_id_idx on audit_events (organization_id);

alter table audit_events enable row level security;
create policy audit_events_select_members on audit_events for select using (is_org_member(organization_id));
create policy audit_events_insert_members on audit_events for insert with check (is_org_member(organization_id));
-- No update/delete policy: the audit log is immutable by design.

-- property_transfers (Phase 8 -- explicit-inclusion transfer requests) -----
create table property_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  property_id uuid not null references properties (id) on delete cascade,
  initiated_by uuid not null references auth.users (id),
  recipient_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  -- explicit inclusion only -- never defaults to "everything"
  included_scope jsonb not null default '{}'::jsonb,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_by_user_id uuid references auth.users (id),
  accepted_organization_id uuid references organizations (id),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_transfers_organization_id_idx on property_transfers (organization_id);
create index property_transfers_property_id_idx on property_transfers (property_id);

create trigger property_transfers_set_updated_at before update on property_transfers
  for each row execute function set_updated_at();

alter table property_transfers enable row level security;
create policy property_transfers_select_members on property_transfers for select
  using (is_org_member(organization_id));
create policy property_transfers_insert_admins on property_transfers for insert
  with check (is_org_admin(organization_id));
create policy property_transfers_update_admins on property_transfers for update
  using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy property_transfers_delete_admins on property_transfers for delete
  using (is_org_admin(organization_id));

-- ============================================================
-- 6. Storage: attachments bucket
--    Paths are namespaced "<organization_id>/<file>"; the first path segment
--    must match an org the caller belongs to. This is the storage-layer
--    equivalent of the organization_id check on every table above -- without
--    it, an authenticated user could read/write another tenant's files by
--    guessing or enumerating storage paths.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy attachments_bucket_select on storage.objects for select
  using (bucket_id = 'attachments' and is_org_member((storage.foldername(name))[1]::uuid));

create policy attachments_bucket_insert on storage.objects for insert
  with check (bucket_id = 'attachments' and is_org_member((storage.foldername(name))[1]::uuid));

create policy attachments_bucket_update on storage.objects for update
  using (bucket_id = 'attachments' and is_org_member((storage.foldername(name))[1]::uuid))
  with check (bucket_id = 'attachments' and is_org_member((storage.foldername(name))[1]::uuid));

create policy attachments_bucket_delete on storage.objects for delete
  using (bucket_id = 'attachments' and is_org_member((storage.foldername(name))[1]::uuid));

-- ============================================================
-- 7. Seed data (global lookups, organization_id = null)
-- ============================================================

insert into record_types (organization_id, key, label) values
  (null, 'maintenance', 'Maintenance'),
  (null, 'repair', 'Repair'),
  (null, 'inspection', 'Inspection'),
  (null, 'installation', 'Installation'),
  (null, 'replacement', 'Replacement'),
  (null, 'renovation', 'Renovation'),
  (null, 'receipt', 'Receipt'),
  (null, 'manual', 'Manual / Guide'),
  (null, 'material', 'Paint / Material'),
  (null, 'note', 'General Note')
on conflict do nothing;

insert into asset_categories (organization_id, key, label) values
  (null, 'appliance', 'Appliance'),
  (null, 'hvac', 'HVAC'),
  (null, 'plumbing', 'Plumbing'),
  (null, 'electrical', 'Electrical'),
  (null, 'structural', 'Structural'),
  (null, 'roofing', 'Roofing'),
  (null, 'exterior', 'Exterior'),
  (null, 'flooring', 'Flooring'),
  (null, 'painting', 'Painting / Finish'),
  (null, 'security', 'Security & Safety'),
  (null, 'landscaping', 'Landscaping'),
  (null, 'other', 'Other')
on conflict do nothing;
