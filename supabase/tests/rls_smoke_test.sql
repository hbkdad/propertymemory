-- Cross-tenant RLS smoke test. Self-asserting: run with `-v ON_ERROR_STOP=1`
-- and a non-zero psql exit code means a real regression, not a human needing
-- to eyeball `\echo`-commented expectations. Runs in CI (see
-- .github/workflows/ci.yml) and can also be run manually against the LOCAL
-- stack -- never against a real project, since it creates fake auth.users
-- rows.
--
-- Usage:
--   supabase start
--   docker exec -i supabase_db_property psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/rls_smoke_test.sql
--   supabase db reset   # clean up afterwards
--
-- Covers properties, assets, and extraction_jobs as representative examples
-- of the same organization_id-based policy pattern (ADR 0002) used on all 20
-- tables -- not exhaustive over every table, but exercises select/insert/
-- update/delete isolation, not just select.
--
-- NOTE: psql's `:'varname'` substitution is pure client-side text
-- replacement and does NOT reach inside a `DO $$ ... $$` block (dollar-
-- quoting is opaque to psql's substitution, same as a single-quoted
-- string) -- confirmed the hard way, this used to just be a syntax error.
-- IDs captured via `\gset` are bridged into DO blocks via
-- set_config()/current_setting() instead of `:'var'`.

begin;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'usera@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'userb@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{}', '{}');

commit;

do $$
declare
  cnt int;
begin
  select count(*) into cnt from profiles;
  if cnt <> 2 then
    raise exception 'expected 2 profiles auto-created by handle_new_user, got %', cnt;
  end if;
end $$;

set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','role','authenticated')::text, false);

-- NOTE: call as `select * from create_organization(...)`, never as
-- `select (create_organization(...)).id` -- the latter's dot-notation
-- composite-field-extraction makes Postgres invoke the function twice,
-- silently creating two organizations. Confirmed locally on Postgres 17.6.1.
select * from create_organization('Org A') \gset org_a_
insert into properties (organization_id, name, created_by) values (:'org_a_id', '12 Main Street', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') returning id \gset org_a_property_
insert into assets (organization_id, property_id, name, created_by) values (:'org_a_id', :'org_a_property_id', 'Furnace', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') returning id \gset org_a_asset_
insert into extraction_jobs (organization_id, kind, status, provider, created_by) values (:'org_a_id', 'appliance_label', 'completed', 'tesseract', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Bridge the psql-side ids into Postgres session variables so later DO
-- blocks can read them via current_setting() -- see note above.
select set_config('rls_test.org_a_id', :'org_a_id', false);
select set_config('rls_test.org_a_property_id', :'org_a_property_id', false);
select set_config('rls_test.org_a_asset_id', :'org_a_asset_id', false);

do $$
declare
  cnt int;
begin
  select count(*) into cnt from organizations; if cnt <> 1 then raise exception 'User A should see exactly 1 org, got %', cnt; end if;
  select count(*) into cnt from properties; if cnt <> 1 then raise exception 'User A should see exactly 1 property, got %', cnt; end if;
  select count(*) into cnt from assets; if cnt <> 1 then raise exception 'User A should see exactly 1 asset, got %', cnt; end if;
end $$;

reset role;
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','role','authenticated')::text, false);

select * from create_organization('Org B') \gset org_b_

do $$
declare
  cnt int;
  org_a_id uuid := current_setting('rls_test.org_a_id')::uuid;
begin
  -- User B must see only Org B -- Org A's org/property/asset/extraction job
  -- must all be invisible, including by guessing Org A's known id directly.
  select count(*) into cnt from organizations; if cnt <> 1 then raise exception 'User B should see exactly 1 org (their own), got %', cnt; end if;
  select count(*) into cnt from properties; if cnt <> 0 then raise exception 'SECURITY REGRESSION: User B can see % of Org A''s properties', cnt; end if;
  select count(*) into cnt from assets; if cnt <> 0 then raise exception 'SECURITY REGRESSION: User B can see % of Org A''s assets', cnt; end if;
  select count(*) into cnt from extraction_jobs; if cnt <> 0 then raise exception 'SECURITY REGRESSION: User B can see % of Org A''s extraction jobs', cnt; end if;
  select count(*) into cnt from organizations where id = org_a_id;
  if cnt <> 0 then raise exception 'SECURITY REGRESSION: User B can read Org A by guessing its id'; end if;
end $$;

do $$
declare
  org_a_id uuid := current_setting('rls_test.org_a_id')::uuid;
begin
  insert into properties (organization_id, name, created_by) values (org_a_id, 'Malicious insert', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  raise exception 'SECURITY REGRESSION: User B inserted a property into Org A';
exception
  when insufficient_privilege then null; -- expected: RLS blocked it
end $$;

do $$
declare
  org_a_id uuid := current_setting('rls_test.org_a_id')::uuid;
  org_a_property_id uuid := current_setting('rls_test.org_a_property_id')::uuid;
begin
  insert into assets (organization_id, property_id, name, created_by) values (org_a_id, org_a_property_id, 'Malicious asset', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  raise exception 'SECURITY REGRESSION: User B inserted an asset into Org A by guessing its property id';
exception
  when insufficient_privilege then null; -- expected: RLS blocked it
end $$;

do $$
declare
  org_a_asset_id uuid := current_setting('rls_test.org_a_asset_id')::uuid;
  affected int;
begin
  -- UPDATE/DELETE against a row RLS hides is silently filtered out of the
  -- statement's target set, not an error -- assert on row count, not on an
  -- exception.
  update assets set name = 'Renamed by attacker' where id = org_a_asset_id;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'SECURITY REGRESSION: User B updated % row(s) of Org A''s asset', affected;
  end if;

  delete from assets where id = org_a_asset_id;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'SECURITY REGRESSION: User B deleted % row(s) of Org A''s asset', affected;
  end if;
end $$;

reset role;

do $$
declare
  org_a_id uuid := current_setting('rls_test.org_a_id')::uuid;
  r record;
begin
  -- Ground truth as postgres (bypasses RLS): exactly 1 property and 1 asset,
  -- still owned by Org A / User A, name unchanged -- none of the malicious
  -- attempts above actually landed.
  select * into r from properties limit 2;
  if not found or r.name <> '12 Main Street' or r.organization_id <> org_a_id then
    raise exception 'ground truth check failed: properties table is not exactly as User A left it';
  end if;
  if (select count(*) from properties) <> 1 then
    raise exception 'ground truth check failed: expected exactly 1 property, got %', (select count(*) from properties);
  end if;

  select * into r from assets limit 2;
  if not found or r.name <> 'Furnace' or r.organization_id <> org_a_id then
    raise exception 'ground truth check failed: assets table is not exactly as User A left it';
  end if;
  if (select count(*) from assets) <> 1 then
    raise exception 'ground truth check failed: expected exactly 1 asset, got %', (select count(*) from assets);
  end if;
end $$;

select 'rls_smoke_test: all checks passed' as result;
