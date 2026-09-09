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

Vitest + React Testing Library are set up (`pnpm test`), covering validation schemas, date-arithmetic edge cases, and the OCR text-parsing regexes -- see `docs/STATUS.md` for the current count.

## End-to-end (Playwright)

`e2e/` covers the critical flows this app can't afford to have silently break, driven through a real Chromium browser against a real `next build` + `next start` (not `next dev` -- see `playwright.config.ts`'s comment on why, and Issues #6/#8/#14/#15 in `docs/STATUS.md`):

- `auth-and-onboarding.spec.ts` -- sign up, confirm by email (fetched from Mailpit's REST API, see `e2e/helpers.ts`), onboard, log out, log back in.
- `property-crud.spec.ts` -- add, edit, and delete a property.
- `tenant-isolation.spec.ts` -- the UI-level companion to `rls_smoke_test.sql` above: two independently signed-up users, User B hits User A's property URL directly and gets a clean 404. RLS proves the database rejects it; this proves the actual request -- routing, auth cookies, everything -- comes back clean too.

Run locally:

```bash
supabase start
cp .env.example .env.local   # fill in the local stack's URL/key (see supabase start's own output)
pnpm exec playwright install --with-deps chromium   # once
pnpm test:e2e
supabase db reset            # clean up the users these tests create
```

Runs automatically in CI (`e2e` job in `.github/workflows/ci.yml`), which spins up the local stack the same way `rls-smoke-test` does and points the app at it by exporting the stack's dynamically-assigned URL/key into `$GITHUB_ENV` (a `.env.local` file wouldn't win here -- Next's dotenv loader never overrides a variable the environment already has, and the workflow's placeholder `env:` block sets one first).

Two non-obvious things found while writing this suite, documented so they aren't rediscovered the hard way:

1. **Local Supabase ships with `enable_confirmations = false`** (the CLI's own scaffold default) -- signups get an immediate session with no email step at all, silently skipping the exact code path (`src/app/auth/confirm/route.ts`) these tests exist to cover. Flipped to `true` in `supabase/config.toml` so local dev matches the real project's behavior.
2. **Use `localhost`, never `127.0.0.1`, as the app's origin in local testing.** Next 16's `NextURL` unconditionally rewrites any `127.x.x.x` hostname to the literal string `"localhost"` when a route handler calls `request.nextUrl.clone()` (see `node_modules/next/dist/server/web/next-url.js`, `REGEX_LOCALHOST_HOSTNAME`) -- which the confirm route does to build its post-confirmation redirect. Starting from `127.0.0.1` means that redirect silently lands on a *different-origin* `localhost` URL that doesn't carry the `127.0.0.1`-scoped session cookie the confirm route just set, so the user bounces back to `/login` looking logged out. This has zero production impact (a real domain is never an IP literal) and never affects a human using `localhost:3010` as this project's own docs already recommend -- it only bit an earlier draft of `playwright.config.ts` that picked `127.0.0.1` as the base URL out of habit.
