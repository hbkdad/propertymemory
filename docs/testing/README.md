# Testing

## Database / RLS

[supabase/tests/rls_smoke_test.sql](../../supabase/tests/rls_smoke_test.sql) verifies cross-tenant isolation against the **local** Supabase stack (never run this against a real project — it inserts fake `auth.users` rows). It's self-asserting (a `RAISE EXCEPTION` inside a `DO` block on any regression, not just `\echo`-commented expectations for a human to eyeball) and **runs automatically in CI** on every push/PR (`.github/workflows/ci.yml`, the `rls-smoke-test` job spins up the local stack in the runner). To run it manually:

```bash
pnpm dlx supabase start
docker exec -i supabase_db_property psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/rls_smoke_test.sql
pnpm dlx supabase db reset   # clean up the fake users afterwards
```

Covers `properties`, `assets`, and `extraction_jobs` as representative examples of the same `organization_id`-based RLS pattern (ADR 0002) used on all 20 tables: select isolation (including reading by a guessed id), insert isolation (a malicious insert is expected to raise a row-level-security policy violation, `SQLSTATE 42501`/`insufficient_privilege`), and update/delete isolation (a statement against a row RLS hides silently affects zero rows rather than erroring, so those are asserted by row count, not by expecting an exception). Verified the test can actually fail, not just always pass: deliberately weakened the `properties` select policy to `using (true)` and confirmed the script caught it and exited non-zero, then reverted.

Known non-issue found while writing this test, documented here so it isn't rediscovered the hard way: calling `create_organization()` as `select (create_organization('x')).id` (dot-notation composite-field extraction) makes Postgres invoke the function **twice**, silently creating two organizations. Calling it the normal way — `select * from create_organization('x')`, which is also how Supabase's `.rpc()` client calls it — invokes it exactly once. See the comment on the function in `supabase/migrations/20260908000000_init_schema.sql`.

Also found while automating this: psql's `:'varname'` substitution is pure client-side text replacement and does **not** reach inside a `DO $$ ... $$` block (dollar-quoting is opaque to it, the same as a single-quoted string) -- using `:'org_a_id'` there is a syntax error, not a silent no-op. IDs captured via `\gset` are bridged into `DO` blocks with `select set_config('rls_test.org_a_id', :'org_a_id', false);` beforehand, then read back inside the block via `current_setting('rls_test.org_a_id')::uuid`.

## Application tests

Vitest + React Testing Library are set up (`pnpm test`), covering validation schemas, date-arithmetic edge cases, and the OCR text-parsing regexes -- see `docs/STATUS.md` for the current count. Playwright E2E is not set up yet; tracked in `docs/STATUS.md`'s Next list.
