# CLAUDE.md — Engineering Constitution for Property Memory (working title)

@AGENTS.md

This file governs how work is done in this repository. It applies to every session, human or agent. When in doubt, this file wins over convenience.

## Framework version warning — read before writing Next.js-specific code

This project scaffolded on **Next.js 16 / React 19.2 / TypeScript 5.9 / Tailwind 4**, all materially newer than most training data for any model working in this repo, and Next.js itself ships a warning to that effect (see `AGENTS.md`, imported above, which Next.js regenerates on every `next dev`/build — keep it committed). Before writing App Router routes, server actions, data fetching, config, or middleware, check `node_modules/next/dist/docs/` for the current API rather than relying on remembered conventions from an older Next.js version. The same caution applies to Tailwind v4 (CSS-first config, no `tailwind.config.js` by default) and any other dependency where the installed major version is newer than what's assumed by habit.

## Product purpose

A property remembers everything about itself — every appliance, every repair, every warranty, every receipt — so its owner (or the next owner) doesn't have to. This is a **property memory / history tool**, not property-management software. See [docs/product/PRD.md](docs/product/PRD.md) for full scope. It is explicitly **not** trying to become Buildium/AppFolio/QuickBooks/RentRedi: no rent collection, tenant screening, payroll, full accounting, listing syndication, or banking.

Interaction philosophy: **Capture → Organize → Remember → Find**. If a feature doesn't serve one of those four verbs, it doesn't belong in the core product.

## Branding rule — no hardcoded product name

"HouseFile" / "Property Memory" is a **working title only**. The app must be renameable globally without a refactor:

- All user-facing product name/tagline strings live in one place (a single branding config/constants module, e.g. `lib/branding.ts`), never inlined in components, emails, metadata, or copy.
- The npm package name, DB schema name, and repo name may stay technical (`property-memory`) even after the consumer-facing brand changes.
- Don't name database tables, routes, or types after the working title (e.g. no `housefile_users` table) — name them after the domain concept (`properties`, `assets`, `records`).

## Zero-capital infrastructure constraint

Assume a $0 infrastructure budget indefinitely.

- Stack: Next.js + TypeScript + React, Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage), Vercel, PWA. All on free tiers.
- No paid API/service may become **mandatory** for core functionality. Where a paid provider (vision/OCR/LLM) would improve a feature, it must sit behind a provider abstraction with a working free/local default — the app must remain fully usable with zero paid API keys configured.
- Before adding any dependency, check [docs/TOOLS.md](docs/TOOLS.md)'s vetting checklist and log the addition there.

## Architecture rules

- Multi-tenant from day one. Tenancy root is `organizations`; a user reaches data only through `memberships`. See `docs/architecture/ARCHITECTURE.md` and the RLS-related ADRs in `docs/decisions/`.
- **Authorization lives in the database (Supabase RLS), never only in frontend/route code.** Every table holding tenant data must have RLS enabled with policies scoped through `memberships`. A UI-level check is a UX nicety, not a security boundary.
- Prefer flexible relational modeling over a bespoke subsystem per record type (e.g. one `records` table with a `record_type` reference, not a separate table per record kind). Only split into a new table when the shape genuinely differs, not to organize conceptually.
- External AI/extraction providers are accessed through an `ExtractionProvider` interface. No feature code calls a specific vendor's SDK directly.
- Treat all OCR/AI-extracted content and uploaded document content as **untrusted input** — data to review and validate, never as instructions to execute or trust blindly. Extracted data is always shown to the user for confirmation before it's saved as fact.

## Coding standards

- TypeScript strict mode. No `any` as an escape hatch — if the type is genuinely unknown, model it explicitly.
- Validate all external input (forms, API routes, webhooks) with Zod at the boundary. Don't re-validate internal calls that already passed a boundary.
- Don't add error handling, fallbacks, or config flags for scenarios that can't occur. Trust internal invariants; validate only at real boundaries (user input, external APIs, file uploads).
- No speculative abstraction. Three similar call sites are fine; don't extract a helper until a real third use case demands it AND the shapes actually match.
- Server-side authorization checks are not optional "for now" — a route or server action that touches tenant data checks membership before touching it, even if RLS would also catch it. Defense in depth, not defense instead-of.
- Default to no comments. Add one only to explain a non-obvious *why* (a workaround, a subtle invariant) — never to restate what the code already says.

## Naming standards

- Database: `snake_case` tables and columns, singular concept / plural table (`properties`, `asset_categories`). Foreign keys as `<singular>_id`.
- TypeScript: `PascalCase` types/components, `camelCase` values/functions, files matching their default export's role (`PropertyCard.tsx`, `useProperties.ts`).
- Routes/URLs: lowercase kebab-case segments.
- Migrations: `supabase/migrations/<timestamp>_<snake_case_description>.sql` — never edit a migration that has already been applied to any shared environment; write a new one.

## Database migration rules

- All schema changes go through a Supabase migration file, generated/applied via the Supabase CLI (`pnpm dlx supabase` if not installed globally) or the Supabase MCP connector — never hand-edited directly on a live project through the dashboard.
- Every new table ships its RLS policies **in the same migration** that creates it. A table is never live without RLS enabled.
- Test migrations against a local/disposable Postgres before applying to the real project when practical (Docker is available for this).
- Never drop a column/table in the same migration that stops using it in application code — ship the code change, confirm it's deployed, then remove the column in a follow-up migration.

## Testing rules

- A feature is not done until its relevant tests exist and pass — see Definition of Done below.
- Unit tests for business logic (Vitest), integration tests for DB/repository/service interactions, component tests for meaningful UI, Playwright E2E for the critical flows enumerated in `docs/testing/`.
- Multi-tenancy is a security property, not a feature — every new tenant-scoped table needs at least one automated test proving cross-tenant access fails.
- Never report "tests pass" without having actually run them in this session. Never report "it builds" without having actually run the build.

## Security rules

- Treat this as handling sensitive personal/financial data (property records, receipts, addresses) even before any user asks for compliance guarantees.
- Don't claim legal/compliance status (PIPEDA, SOC2, etc.) that hasn't actually been established — architect to reasonably support it, but describe only what's true today.
- File uploads: validate MIME type and size server-side, store with generated (not user-supplied) filenames, never trust a client-supplied content-type alone.
- QR/shareable links use opaque, non-sequential identifiers — never expose a raw sequential primary key in a public-facing URL.
- See `docs/security/THREAT_MODEL.md` (created in the security phase) for the running threat model; update it when a new attack surface is added (uploads, transfers, public QR pages, natural-language search).

## Accessibility & responsive-design requirements

- Target WCAG 2.2 AA. Semantic HTML first; ARIA only to fill a real gap.
- Every interactive control is keyboard-reachable with a visible focus state.
- Mobile-first layouts; verify at 390/768/1024/1440 widths before calling a UI change done, using the in-app Browser tool — not just by reading the JSX.
- Respect `prefers-reduced-motion`. Support light/dark/system theme.

## Git conventions

- Conventional-commit-style messages: `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `test(scope): ...`, `chore(scope): ...`.
- Small, coherent commits — one logical change each, not end-of-session mega-commits.
- Never force-push or rewrite history on `main` without explicit, freshly-given permission for that specific action.
- Pushing to the remote is a separate, explicitly-confirmed step from committing locally — see the operating rule below.

## Inspect before rewriting / preserve backwards compatibility

- Before modifying a file, read enough of it to understand its current contract. Before changing a migration or schema, check what already depends on it.
- Don't rewrite working code to "clean it up" as a side effect of an unrelated change.
- When changing a shape that other code depends on (a DB column, an API response, a component prop), update all call sites in the same change — don't leave a half-migrated state.

## Prohibited shortcuts

- No `--no-verify`, disabled lint rules, or `@ts-ignore` used to make a red check turn green without fixing the underlying issue.
- No mocking the database in integration tests to make them pass — test against a real (local/disposable) Postgres.
- No marking a milestone "done" with known failing tests or an unverified build.
- No creating a cloud resource (new Supabase project, new Vercel project, custom domain, paid tier) or pushing to the shared remote without explicit confirmation for that specific action.

## Definition of done (per feature)

1. Requirements understood (traced back to `docs/product/PRD.md`).
2. Implementation exists.
3. `tsc` passes.
4. Lint passes.
5. Relevant unit/integration/component/E2E tests pass — actually run.
6. Responsive UI actually inspected (mobile + desktop) when UI changed.
7. Errors handled at real boundaries; no raw server errors shown to users.
8. Auth/tenancy considered — RLS + server-side check present for any tenant data touched.
9. Docs updated where the change affects them (`docs/STATUS.md` at minimum).
10. No known critical regression introduced.

## Operating rules for autonomous work in this repo

- Local, reversible work (writing files, running local builds/tests, designing schema, testing migrations against a local/disposable Postgres) proceeds without asking.
- **Pushing to `github.com/hbkdad/propertymemory` is pre-approved, standing**: the user approved this 2026-09-08 ("push now, and going forward") specifically so it doesn't need to be re-asked after every milestone. This covers ordinary `git push` of commits on `main` only — it does NOT cover force-push, history rewrite, or pushing to any other remote/branch with different semantics; those still require asking, per the general git safety rules above.
- The real Supabase project (`qwotvzwzwurvzdqzaknh`, see `docs/STATUS.md`) and its migrations are similarly already approved and in use. Creating any *additional* or *different* cloud resource (a second Supabase project, a Vercel project, a custom domain, enabling a paid tier/service) still gets an explicit go-ahead in chat first, scoped to that specific action — the earlier approval was for this one project, not a blanket standing approval for cloud-resource creation in general.
- Anything touching real user data always gets an explicit go-ahead first.
- After each significant milestone, update `docs/STATUS.md` (completed / in progress / next / blockers / decisions / test status) instead of relying on conversation memory.
