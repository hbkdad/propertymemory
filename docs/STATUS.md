# Project Status

Last updated: 2026-09-08

## Completed

- **Phase 0** (environment/capability audit): [docs/CAPABILITY_MATRIX.md](CAPABILITY_MATRIX.md), [docs/TOOLS.md](TOOLS.md).
- **Phase 1** (governance): [CLAUDE.md](../CLAUDE.md) — engineering constitution, including a hard warning that this repo runs Next.js 16 / React 19.2 / TypeScript 5.9 / Tailwind 4 and to check `node_modules/next/dist/docs/` before writing framework-specific code (this mattered in practice — see below).
- **Phase 2** (product requirements): [docs/product/PRD.md](product/PRD.md), [docs/PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md).
- **Phase 3** (architecture): [docs/architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) and ADRs 0001–0005 in [docs/decisions/](decisions/).
- **Database schema**: [supabase/migrations/](../supabase/migrations/) — 20 tables, RLS on every one, storage bucket policy, seed data. Verified locally (Docker) and on the real project via `get_advisors`; one gap found and fixed same-session (see Security below).
- **Real Supabase project**: `property-memory` (`qwotvzwzwurvzdqzaknh`), org "HBK Customs", ca-central-1, $0/month. Both migrations applied.
- **Next.js app scaffold**: Next.js 16.3.4 / React 19.2.8 / TypeScript 5.9.3 / Tailwind 4.3.3. Branding centralized in `src/lib/branding.ts` (ADR 0003).
- **Authentication, fully built and live-verified**: signup, login, logout, forgot/reset password, email confirmation — `src/lib/actions/auth.ts`, `src/app/{login,signup,forgot-password,reset-password,error}/`, `src/app/auth/confirm/route.ts`, `src/lib/supabase/{client,server,proxy}.ts`, `src/proxy.ts` (Next 16 renamed Middleware → Proxy), `src/lib/dal.ts` (session/membership helpers using `getClaims()`, the current-recommended validation call).
- **Onboarding**: `src/app/onboarding/` + `src/lib/actions/onboarding.ts` — calls the `create_organization()` RPC (via the safe `.rpc()` calling form, not raw SQL) and creates the first property in one flow.
- **Properties CRUD**: `src/app/properties/{new,[id]}/`, `src/lib/actions/properties.ts`, dashboard list at `src/app/dashboard/`. Create/read/update/delete all live-verified.
- **Testing infra**: Vitest + React Testing Library configured (`vitest.config.mts`, `pnpm test`); 11 passing unit tests for the Zod validation schemas. Playwright not yet set up (tracked in Next).
- **TypeScript types** generated from the real schema: `src/lib/supabase/database.types.ts` (regenerate via the Supabase MCP connector after any schema change).

## Verified (live, in-browser, against the local Supabase stack with Mailpit catching real emails)

Full loop, no gaps: signup → onboarding (org + first property created) → dashboard → logout → login → forgot-password → real email received → `/auth/confirm` → password actually changed → login with new password → add property → edit property → delete property. Also verified: `pnpm build`, `pnpm test`, and the RLS cross-tenant isolation suite (`supabase/tests/rls_smoke_test.sql`).

## Issues found and fixed this session (not swept under the rug)

1. **`anon` could still call privileged RPCs** after the initial migration (wrong grantee revoked). Fixed in `20260908000100_security_hardening.sql`, re-verified via `get_advisors`. `create_organization` was never actually exploitable due to its own `auth.uid()` check — a real instance of defense-in-depth paying off.
2. **Local Supabase's default email templates link to Auth's own `/auth/v1/verify` endpoint, not to the app.** This silently broke the documented `/auth/confirm` route pattern (confirmed by testing: the redirect dropped our path and query entirely). Fixed by customizing `confirmation`/`recovery` templates (`supabase/templates/`) to link directly to `{{ .RedirectTo }}/auth/confirm?token_hash=...`, per Supabase's own "Email templates when using redirectTo" doc. **This has not been confirmed on the real hosted project** — its default template may or may not already be correct; if signup confirmation or password reset misbehaves after deployment, check this first (see Next).
3. **Local dev port conflicts**: this machine runs another of the user's projects' (`astrasequence`) local Supabase stack on the default ports, and Chrome/another app on 3000. Local Supabase remapped to 55321-55329 (`supabase/config.toml`); the app's dev server pinned to a fixed port 3010 (`.claude/launch.json`, autoPort disabled) — needed because Supabase Auth only allows *exact* redirect URLs, not wildcards, so a randomly auto-assigned port silently broke email-link redirects.
4. **Nested `<form>` elements** in the property edit page (delete confirmation form inside the update form) — invalid HTML, caused a React hydration error, caught by live browser testing (not by `pnpm build`, which doesn't check HTML nesting). Fixed by making the delete form a sibling and linking the "Save changes" button back to the update form via the HTML `form` attribute.
5. **A native `window.confirm()` for delete silently no-op'd** in the automated browser testing context — replaced with a proper in-page two-step confirmation, which is also better UX/accessibility and doesn't depend on browser-specific dialog behavior.
6. Two Supabase local-stack Docker networking flakes (a stale DNS resolution after restarting a single container out of sync with the rest of the stack) — resolved both times with a full `supabase stop && supabase start`, not by working around them. Not a code issue.

## Completed (continued)

- **Spaces and Assets CRUD**, nested under the property detail page (`src/app/properties/[id]/spaces-section.tsx`, `src/lib/actions/spaces.ts`; `src/app/properties/[id]/assets/new/`, `src/app/assets/[id]/`, `src/lib/actions/assets.ts`, shared `src/components/asset-form.tsx`). Units are intentionally not built yet — spaces attach directly to the property for now (`unit_id` left null), which covers the primary homeowner persona; landlord-specific units UI is deferred, not designed away (the schema already supports it).
- Live-verified end to end: add space → add asset (category + space dropdowns populated correctly from real data) → edit asset → delete asset → remove space.

One more real issue found and fixed via live testing: a freshly-added nested dynamic route (`/properties/[id]/assets/new`) 404'd on the running dev server even though `pnpm build` had already validated it as a real route — a Turbopack dev-server file-watcher staleness quirk, resolved by restarting the dev server. Not a code defect; worth knowing if a brand-new route ever 404s despite a clean build.

## Completed (continued)

- **Records** (the flexible timeline entity, ADR 0005): `src/app/properties/[id]/records-section.tsx`, `src/lib/actions/records.ts`. A single "Attached to" selector (not two dropdowns) maps to `space_id` XOR `asset_id` server-side (`parseScope` in `src/lib/validations/record.ts`), matching the DB's `records_single_scope` check constraint by construction rather than by hoping the client behaves. Live-verified: added a space, added a record scoped to it with a cost, confirmed the raw row (`space_id` set, `asset_id` null) and the joined display (type/space/cost labels all correct via one embedded Supabase query), then deleted it.

## Completed (continued)

- **Attachments** (Supabase Storage), currently wired to assets (`src/components/attachments-section.tsx`, `src/lib/actions/attachments.ts`, `src/lib/validations/attachment.ts`; reusable for property/record/warranty attachments later via the same `ownerColumn` parameter). Upload happens inside a server action (file arrives via native FormData support for File objects), validated against a MIME allow-list and the 25MB cap *before* anything touches Storage; `next.config.ts` raises the server action body-size limit to 26MB to accommodate it (default is 1MB). Viewing uses short-lived (5 min) signed URLs generated server-side per page load, since the bucket is private.
- Live-verified thoroughly, including failure paths, not just the happy path: uploaded a real file (confirmed the exact bytes landed in `storage.objects` with correct metadata, and the `attachments` row had the right owner column set and nothing else); opened the signed URL directly and confirmed the browser decoded it as a real 1×1 PNG; deleted it and confirmed both the storage object and DB row were gone (no orphans either direction); attempted to upload a disallowed file type (`text/plain`) and confirmed the server action rejected it with the expected message and nothing was persisted anywhere. File input automation used a DOM-level `DataTransfer`/`File` construction (the standard technique for scripting file inputs, which browsers don't allow via plain `.value` assignment) — this exercised the real server-side validation path, not just the `accept` attribute's picker-level hint.

## Next

1. **Before deploying**: configure the real Supabase project's Auth → URL Configuration (site URL, redirect URLs) and Auth → Email Templates (confirmation, recovery) via the dashboard to match what's in `supabase/config.toml`/`supabase/templates/` — there's no MCP tool for this, and it can't be verified until there's a real domain. Do this deliberately, don't assume the hosted defaults already match.
2. Warranties, expenses, reminders, global search, QR, export, smart capture — per the roadmap, in that rough order of MVP dependency.
3. Extend attachments UI to properties/records/warranties (the action already supports any owner column).
4. Units UI, if/when a landlord-focused push warrants it (schema already supports it).
5. Playwright E2E setup, and promoting `rls_smoke_test.sql` from a manual script to an automated check.

## Blockers

None.

## Decisions log

See [docs/decisions/](decisions/) for full ADRs (0001 stack, 0002 RLS multi-tenancy, 0003 branding abstraction, 0004 extraction-provider abstraction, 0005 flexible record modeling).

## Test status

- `pnpm build`: passing.
- `pnpm test` (Vitest): 11/11 passing.
- RLS cross-tenant isolation: passing (manual script, see `supabase/tests/`).
- Full auth + onboarding + properties CRUD: live-verified in-browser, see above.
