# Project Status

Last updated: 2026-09-08

## Completed

**Foundation** — [docs/CAPABILITY_MATRIX.md](CAPABILITY_MATRIX.md), [docs/TOOLS.md](TOOLS.md), [CLAUDE.md](../CLAUDE.md) (engineering constitution — includes a hard warning that this repo runs Next.js 16 / React 19.2 / TypeScript 5.9 / Tailwind 4, and to check `node_modules/next/dist/docs/` before writing framework-specific code; this mattered in practice, see Issues below), [docs/product/PRD.md](product/PRD.md), [docs/PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md), [docs/architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) + ADRs 0001–0005 in [docs/decisions/](decisions/).

**Database** — [supabase/migrations/](../supabase/migrations/): 20 tables, RLS enabled and policied on every one, a storage bucket policy for attachments, seed data for record types and asset categories. Verified locally (Docker) and on the real project via `get_advisors`. Real project: `property-memory` (`qwotvzwzwurvzdqzaknh`), org "HBK Customs", ca-central-1, $0/month.

**App scaffold** — Next.js 16.3.4 / React 19.2.8 / TypeScript 5.9.3 / Tailwind 4.3.3. Branding centralized in `src/lib/branding.ts` (ADR 0003).

**Authentication** — signup, login, logout, forgot/reset password, email confirmation. `src/lib/actions/auth.ts`, `src/app/{login,signup,forgot-password,reset-password,error}/`, `src/app/auth/confirm/route.ts`, `src/lib/supabase/{client,server,proxy}.ts`, `src/proxy.ts` (Next 16 renamed Middleware → Proxy), `src/lib/dal.ts` (session/membership helpers using `getClaims()`).

**Onboarding** — `src/app/onboarding/` + `src/lib/actions/onboarding.ts`: calls `create_organization()` via `.rpc()` and creates the first property in one flow.

**Core property data model, full CRUD on all of it**:
- Properties — `src/app/properties/{new,[id]}/`, `src/lib/actions/properties.ts`
- Spaces — nested on the property page, `src/app/properties/[id]/spaces-section.tsx`, `src/lib/actions/spaces.ts`. Units intentionally not built yet (schema supports them; spaces attach directly to the property for now — covers the primary homeowner persona, landlord-specific units UI deferred not designed away)
- Assets — `src/app/properties/[id]/assets/new/`, `src/app/assets/[id]/`, `src/lib/actions/assets.ts`, shared `src/components/asset-form.tsx`
- Records (the flexible timeline entity, ADR 0005) — `src/app/properties/[id]/records-section.tsx`, `src/lib/actions/records.ts`. A single "Attached to" selector maps to `space_id` XOR `asset_id` server-side (`parseScope`), matching the DB's `records_single_scope` check constraint by construction
- Attachments (Supabase Storage) — `src/components/attachments-section.tsx`, `src/lib/actions/attachments.ts`, wired to both properties and assets via one `ownerColumn` parameter (records/warranties not wired yet). Upload runs in a server action (Files arrive via native FormData support), validated against a MIME allow-list and the 25MB cap before touching Storage; `next.config.ts` raises the server-action body limit to 26MB. Viewing uses signed URLs (private bucket)
- Warranties — `src/components/warranties-section.tsx`, `src/lib/actions/warranties.ts`, shown on both property (whole-property, `asset_id is null`) and asset pages (one component, `assetId` prop picks the mode). Flags anything expiring within 60 days
- Expenses — `src/components/expenses-section.tsx`, `src/lib/actions/expenses.ts`, with a running total per property
- Reminders — `src/components/reminders-section.tsx`, `src/lib/actions/reminders.ts`, `src/lib/validations/reminder.ts`. One-time reminders go inactive on completion; recurring ones roll `due_on` forward and stay active. Overdue ones are flagged

**Testing** — Vitest + RTL configured (`pnpm test`), 15 passing unit tests (validation schemas + `advanceDueDate` date arithmetic). `pnpm build` clean throughout. Playwright not yet set up. `src/lib/supabase/database.types.ts` generated from the real schema (regenerate via the Supabase MCP connector after schema changes).

## Verified

Everything above was exercised **live in-browser** against the local Supabase stack (Mailpit catching real emails), not just via `pnpm build`. Full loop with no gaps: signup → onboarding (org + first property) → dashboard → logout → login → forgot-password → real email received → `/auth/confirm` → password changed → re-login with it → property CRUD → space/asset CRUD (category and space dropdowns populated from real data) → record with cost (raw row + joined display both checked) → file upload (exact bytes confirmed in `storage.objects`, signed URL confirmed to serve a real image, clean delete with no orphans, a disallowed MIME type correctly rejected) → warranty on both a property and an asset (correct scoping, "expiring soon" flag verified) → expense (total math checked) → reminder completion (both the one-time-goes-inactive and recurring-advances-and-stays-active branches, checked against the raw DB row each time). Cross-tenant RLS isolation independently verified via [supabase/tests/rls_smoke_test.sql](../supabase/tests/rls_smoke_test.sql).

## Issues found and fixed (none swept under the rug)

1. **`anon` could still call privileged RPCs** after the initial migration (wrong grantee revoked — Supabase grants EXECUTE directly to `anon`, not through `public`). Fixed in `20260908000100_security_hardening.sql`, re-verified via `get_advisors`. `create_organization` was never actually exploitable due to its own `auth.uid()` check — defense-in-depth paying off in practice.
2. **Local Supabase's default email templates link to Auth's own `/auth/v1/verify` endpoint, not to the app**, silently breaking the documented `/auth/confirm` route pattern. Fixed with custom templates (`supabase/templates/`) linking directly to `{{ .RedirectTo }}/auth/confirm?token_hash=...`. **Not yet confirmed on the real hosted project** — see Next, item 1.
3. **Local dev port conflicts** with another of the user's projects (`astrasequence`) and other local apps. Local Supabase remapped to 55321-55329; the app's dev server pinned to a fixed port 3010 (`.claude/launch.json`, autoPort disabled) — necessary because Supabase Auth only allows *exact* redirect URLs, not wildcards.
4. **Nested `<form>` elements** (delete confirmation inside the update form) caused a real React hydration error — invalid HTML that `pnpm build` doesn't catch. Fixed by making the delete form a sibling, linked back via the HTML `form` attribute.
5. **A native `window.confirm()` for delete silently no-op'd** under automated testing — replaced with an in-page two-step confirmation (also better UX/accessibility, no dependency on browser dialog behavior).
6. **A freshly-added nested route 404'd on the dev server** despite a clean `pnpm build` — Turbopack file-watcher staleness, resolved by restarting the dev server. Not a code defect.
7. **`advanceDueDate`'s month arithmetic overflowed on month-end dates** — a monthly reminder due Jan 31 would silently jump to Mar 3 instead of Feb 28, skipping February. Caught by a unit test written *before* trusting the function (`src/lib/validations/reminder.test.ts`, includes a leap-year case), then fixed by clamping to the target month's actual last day.
8. Two Supabase local-stack Docker networking flakes (stale DNS after restarting one container out of sync with the rest of the stack) — resolved with a full `supabase stop && supabase start`. Not a code issue.

**Global search** — `src/app/search/page.tsx`. A plain `<form method="get">` (no server action needed for a read) running structured `ilike` queries across properties/assets/records/vendors in parallel, RLS-scoped automatically like every other query in the app. One query layer so a later semantic-search addition is an internal swap (ARCHITECTURE.md). Live-verified: exact and case-insensitive substring matches against a property address and an asset manufacturer, and a genuine no-results case, all against real data.

Note on how that was tested, not a product bug: pressing Enter to submit via the browser-automation tool's synthetic keyboard events didn't trigger the native single-input-form-submits-on-Enter behavior, which real browsers gate to trusted user-generated keystrokes. Diagnosed with direct JS inspection (`input.value`, `window.location.href`) rather than assumed, confirmed not a bug, then added a visible Search submit button anyway since that's better UX/accessibility regardless of the testing wrinkle -- verified the real functionality through that button instead.

## Next

1. **Before deploying**: configure the real Supabase project's Auth → URL Configuration (site URL, redirect URLs) and Auth → Email Templates (confirmation, recovery) via the dashboard to match `supabase/config.toml`/`supabase/templates/` — no MCP tool covers this, and it can't be verified without a real domain.
2. QR asset identifiers, PDF/CSV export, smart capture, PWA — the remaining MVP-gate items.
3. Extend attachments to records/warranties too (property and asset already covered; the action already supports any owner column).
4. A dashboard widget surfacing expiring warranties / upcoming reminders across all of a user's properties (currently per-property view only).
5. Units UI, if/when a landlord-focused push warrants it (schema already supports it).
6. Playwright E2E setup, and promoting `rls_smoke_test.sql` from a manual script to an automated check.

## Blockers

None.

## Decisions log

See [docs/decisions/](decisions/) for full ADRs (0001 stack, 0002 RLS multi-tenancy, 0003 branding abstraction, 0004 extraction-provider abstraction, 0005 flexible record modeling).

## Test status

- `pnpm build`: passing.
- `pnpm test` (Vitest): 15/15 passing.
- RLS cross-tenant isolation: passing (manual script, see `supabase/tests/`).
- Full auth + onboarding + property data model (spaces/assets/records/attachments/warranties/expenses/reminders): live-verified in-browser, see above.
