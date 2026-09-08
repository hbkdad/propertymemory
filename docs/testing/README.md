# Testing

## Database / RLS

[supabase/tests/rls_smoke_test.sql](../../supabase/tests/rls_smoke_test.sql) verifies cross-tenant isolation against the **local** Supabase stack (never run this against a real project — it inserts fake `auth.users` rows):

```bash
pnpm dlx supabase start
docker exec -i supabase_db_property psql -U postgres -d postgres < supabase/tests/rls_smoke_test.sql
pnpm dlx supabase db reset   # clean up the fake users afterwards
```

Verified 2026-09-08 against Postgres 17.6.1 (local): two simulated users, each creates their own organization; User B cannot see User A's organization or property through `select`, cannot read it by guessing its id, and a direct `insert` into User A's organization is rejected with a row-level-security policy violation. This is a manual verification script for now — promoting it to an automated pgTAP suite (`supabase test db`) or a CI-run integration test is tracked as MVP-gate work (see [docs/PRODUCT_ROADMAP.md](../PRODUCT_ROADMAP.md)).

Known non-issue found while writing this test, documented here so it isn't rediscovered the hard way: calling `create_organization()` as `select (create_organization('x')).id` (dot-notation composite-field extraction) makes Postgres invoke the function **twice**, silently creating two organizations. Calling it the normal way — `select * from create_organization('x')`, which is also how Supabase's `.rpc()` client calls it — invokes it exactly once. See the comment on the function in `supabase/migrations/20260908000000_init_schema.sql`.

## Application tests

Not set up yet — Vitest/React Testing Library/Playwright are planned for when there's application code to test (see `docs/STATUS.md`).
