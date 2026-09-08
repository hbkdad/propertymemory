-- Cross-tenant RLS smoke test. Not automated CI yet (see docs/testing/README.md)
-- -- run manually against the LOCAL stack only, never against a real project,
-- since it creates fake auth.users rows.
--
-- Usage:
--   supabase start
--   docker exec -i supabase_db_property psql -U postgres -d postgres < supabase/tests/rls_smoke_test.sql
--   supabase db reset   # clean up afterwards
--
-- Every section states what it expects; a result that doesn't match the
-- stated expectation is a regression in the RLS policies, not the test.
--
-- Covers properties (the original check) plus assets and extraction_jobs, as
-- representative examples of the same organization_id-based policy pattern
-- (ADR 0002) used on all 20 tables -- not exhaustive over every table, but
-- exercises select/insert/update/delete isolation, not just select.

begin;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'usera@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{}', '{}'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'userb@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{}', '{}');

commit;

\echo '=== expect: 2 profiles, auto-created by the handle_new_user trigger ==='
select id, display_name from profiles order by display_name;

set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','role','authenticated')::text, false);

-- NOTE: call as `select * from create_organization(...)`, never as
-- `select (create_organization(...)).id` -- the latter's dot-notation
-- composite-field-extraction makes Postgres invoke the function twice,
-- silently creating two organizations. Confirmed locally on Postgres 17.6.1.
\echo '=== User A creates Org A ==='
select * from create_organization('Org A') \gset org_a_
\echo '=== User A creates a property in Org A ==='
insert into properties (organization_id, name, created_by) values (:'org_a_id', '12 Main Street', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') returning id \gset org_a_property_
\echo '=== User A adds an asset and an extraction job to that property ==='
insert into assets (organization_id, property_id, name, created_by) values (:'org_a_id', :'org_a_property_id', 'Furnace', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') returning id \gset org_a_asset_
insert into extraction_jobs (organization_id, kind, status, provider, created_by) values (:'org_a_id', 'appliance_label', 'completed', 'tesseract', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

\echo '=== expect: exactly one org (Org A), one property (12 Main Street), one asset (Furnace) ==='
select name from organizations;
select name from properties;
select name from assets;

reset role;
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','role','authenticated')::text, false);

\echo '=== User B creates Org B ==='
select * from create_organization('Org B') \gset org_b_

\echo '=== expect: ONLY Org B -- Org A must not appear ==='
select name from organizations;

\echo '=== expect: ZERO rows -- Org A''s property must be invisible to User B ==='
select name from properties;

\echo '=== expect: ZERO rows -- Org A''s asset and extraction job must be invisible to User B ==='
select name from assets;
select kind from extraction_jobs;

\echo '=== expect: ZERO rows -- User B cannot read Org A directly by its known id ==='
select name from organizations where id = :'org_a_id';

\echo '=== expect: ERROR (row-level security policy violation) ==='
insert into properties (organization_id, name, created_by) values (:'org_a_id', 'Malicious insert', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '=== expect: ERROR (row-level security policy violation) -- inserting an asset into Org A by guessing its id ==='
insert into assets (organization_id, property_id, name, created_by) values (:'org_a_id', :'org_a_property_id', 'Malicious asset', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

\echo '=== expect: UPDATE 0 -- User B cannot rename Org A''s asset by its known id (RLS filters it out, not an error) ==='
update assets set name = 'Renamed by attacker' where id = :'org_a_asset_id';

\echo '=== expect: DELETE 0 -- User B cannot delete Org A''s asset by its known id ==='
delete from assets where id = :'org_a_asset_id';

reset role;
\echo '=== ground truth as postgres (bypasses RLS): exactly 1 property and 1 asset, still owned by Org A / User A, name unchanged -- none of the malicious attempts above landed ==='
select organization_id, name, created_by from properties;
select organization_id, name, created_by from assets;
