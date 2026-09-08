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
insert into properties (organization_id, name, created_by) values (:'org_a_id', '12 Main Street', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

\echo '=== expect: exactly one org (Org A), one property (12 Main Street) ==='
select name from organizations;
select name from properties;

reset role;
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','role','authenticated')::text, false);

\echo '=== User B creates Org B ==='
select * from create_organization('Org B') \gset org_b_

\echo '=== expect: ONLY Org B -- Org A must not appear ==='
select name from organizations;

\echo '=== expect: ZERO rows -- Org A''s property must be invisible to User B ==='
select name from properties;

\echo '=== expect: ZERO rows -- User B cannot read Org A directly by its known id ==='
select name from organizations where id = :'org_a_id';

\echo '=== expect: ERROR (row-level security policy violation) ==='
insert into properties (organization_id, name, created_by) values (:'org_a_id', 'Malicious insert', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

reset role;
\echo '=== ground truth as postgres (bypasses RLS): exactly 1 property, still owned by Org A / User A only -- the malicious insert above must not have landed ==='
select organization_id, name, created_by from properties;
