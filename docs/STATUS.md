# Project Status

Last updated: 2026-09-08

## Completed

- **Phase 0** (environment/capability audit): [docs/CAPABILITY_MATRIX.md](CAPABILITY_MATRIX.md), [docs/TOOLS.md](TOOLS.md). Supabase and Vercel MCP connectors both confirmed authenticated; no existing cloud project for this product yet (5 unrelated projects exist under the same Supabase account, all paused).
- **Phase 1** (governance): [CLAUDE.md](../CLAUDE.md) — engineering constitution, including a hard warning that this repo runs Next.js 16 / React 19.2 / TypeScript 5.9 / Tailwind 4, versions newer than most training data, with instructions to check `node_modules/next/dist/docs/` before writing framework-specific code.
- **Phase 2** (product requirements): [docs/product/PRD.md](product/PRD.md), [docs/PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md).
- **Phase 3** (architecture slice): [docs/architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) and ADRs 0001–0005 in [docs/decisions/](decisions/).
- **Database schema, verified**: [supabase/migrations/20260908000000_init_schema.sql](../supabase/migrations/20260908000000_init_schema.sql) — 20 tables, RLS enabled and policied on every one, a storage bucket + policy for attachments, seed data for record types and asset categories. Verified against a local, disposable Postgres (Docker, via `supabase start`/`db reset`, run three times clean):
  - All 20 tables confirmed present with `relrowsecurity = true`.
  - Seed counts confirmed (10 record types, 12 asset categories).
  - Cross-tenant isolation smoke-tested end to end with two simulated users — see [supabase/tests/rls_smoke_test.sql](../supabase/tests/rls_smoke_test.sql) and [docs/testing/README.md](testing/README.md): User B cannot see User A's organization or property, cannot read it by guessing its id, and a direct malicious insert into User A's organization is rejected by RLS.
  - One non-issue found and documented: calling `create_organization()` via dot-notation (`select (create_organization(x)).id`) double-invokes it; the normal calling form (`select * from ...`, same as Supabase's `.rpc()`) does not. Commented in the migration.
- **Next.js app scaffold**: Next.js 16.3.4 / React 19.2.8 / TypeScript 5.9.3 / Tailwind 4.3.3, App Router, pnpm. `pnpm build` passes. Branding centralized in [src/lib/branding.ts](../src/lib/branding.ts) per ADR 0003; the default create-next-app landing page has been replaced with a minimal placeholder using it. Local dev/build verified; not yet visually checked in a browser across breakpoints (no real UI exists yet to check).
- Local Supabase dev stack runs on a remapped port block (55321–55329) because this machine already runs another project's (`astrasequence`) local stack on the default Supabase ports — see `supabase/config.toml`.

## In progress / next

Both prior go/no-go decisions were approved by the user 2026-09-08: push to GitHub (now and after each future milestone, without asking again each time) and create the real Supabase project. Both are done — see Completed above.

1. Wire up real Supabase Auth (signup/login/logout/reset) using `@supabase/ssr`, against the real project (`qwotvzwzwurvzdqzaknh`, `.env.local`, not committed). Confirmed via Supabase's docs search: current env var convention is `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the newer `sb_publishable_...` key format, not the legacy anon JWT). Note Next.js 16 renamed Middleware to **Proxy** (`proxy.ts`, not `middleware.ts`; exported function is `proxy`, not `middleware`) — this changes the standard Supabase session-refresh snippet's file name/export, not its logic.
2. Onboarding flow → `create_organization()` + first property.
3. Core CRUD (properties → units/spaces → assets → records) per the MVP scope in the PRD.

## Blockers

None.

## Real Supabase project

- Project ref: `qwotvzwzwurvzdqzaknh`, name `property-memory`, org `HBK Customs` (`jecllmvbkiwhorczibxt`), region `ca-central-1`, $0/month (confirmed via `get_cost` before creation).
- Both migrations applied and verified via `get_advisors` + `list_tables`: 20 tables, all RLS-enabled, seed counts correct (10 record types, 12 asset categories).
- Security-advisor finding fixed same-session, before any real data existed: `is_org_member`/`is_org_admin`/`create_organization` were still callable by the unauthenticated `anon` role after the original migration's `revoke ... from public` — that revoke targeted the wrong grantee, since Supabase grants EXECUTE directly to `anon`/`authenticated`, not through `public`. Fixed in `supabase/migrations/20260908000100_security_hardening.sql` (revoke from `anon` explicitly) and re-verified clean. `create_organization`'s actual exploitability was already zero thanks to its own `auth.uid() is null` guard — a real example of why the defense-in-depth rule in CLAUDE.md/ADR 0002 (grant-level AND function-level checks) matters in practice, not just in theory.
- One advisory finding left open, deliberately deferred rather than rushed: `pg_trgm` extension installed in the `public` schema (Supabase recommends a dedicated `extensions` schema). Low real risk (namespace hygiene, not a data-exposure issue); moving it now would mean dropping and recreating 8 trigram indexes. Tracked here for a deliberate follow-up rather than done under time pressure.

## Decisions log

See [docs/decisions/](decisions/) for full ADRs. Summary: Next.js+Supabase+Vercel stack (0001); RLS-based multi-tenancy with a denormalized `organization_id` on every tenant table (0002); centralized branding so the working title can change without a refactor (0003); AI/OCR extraction behind a provider interface with a free/local default (0004); one flexible `records` table instead of one table per record type, `vendors`/`contractors` unified (0005).

## Test status

- Database RLS: manually verified, passing (see above). Not yet automated into CI.
- Application: no application code beyond the scaffold's default page yet — nothing to test.
- `pnpm build`: passing.
