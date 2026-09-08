# Architecture Overview

See [docs/decisions/](../decisions/) for the reasoning behind each choice below (ADRs), and [docs/product/PRD.md](../product/PRD.md) for what this is in service of.

## Stack

- **Next.js (App Router) + TypeScript + React** — single deployable, server components by default, server actions for mutations.
- **Tailwind CSS + shadcn/ui + lucide-react** — design-token-driven styling, accessible primitives (Radix under the hood).
- **Supabase** — Postgres (data), Auth (email + session), Storage (attachments), Row Level Security (authorization boundary).
- **Vercel** — hosting, previews, cron (for reminder digests).
- **Zod** — boundary validation (forms, server actions, API routes, webhooks).
- **React Hook Form** — form state.
- **Vitest + React Testing Library + Playwright** — unit/component/E2E.
- **PWA** via a maintained Next.js-compatible plugin — manifest, icons, install prompt, minimal offline shell.

All of the above are free-tier-capable. No paid API is required for the app to function — see the extraction-provider ADR for how AI/OCR stays optional.

## High-level shape

```
Browser (PWA)
   │
   ▼
Next.js App Router (Vercel)
   ├─ Server Components — read paths, RLS-scoped queries via Supabase server client
   ├─ Server Actions — writes, always re-check membership server-side even though RLS also enforces it
   └─ Route Handlers — webhooks (Stripe later), QR redirect, export generation
   │
   ▼
Supabase
   ├─ Postgres + RLS  — source of truth, tenant isolation boundary
   ├─ Auth            — session/JWT, referenced by RLS policies via auth.uid()
   └─ Storage         — attachments, bucket-per-concern with RLS-equivalent storage policies
```

## Multi-tenancy

Tenancy root is `organizations`. A user only ever reaches a row through `memberships` (`user_id`, `organization_id`, `role`). Every tenant-scoped table carries `organization_id` (directly or via its parent) and an RLS policy gated on membership. See [ADR 0002](../decisions/0002-multi-tenancy-rls.md).

Authorization is enforced twice, deliberately: RLS in Postgres (the real boundary) and a server-side membership check in the server action/route handler (defense in depth, and a better error message than a silent empty result). Frontend code never filters for security — only for UX (e.g. hiding a button).

## Domain hierarchy → schema

```
organizations ─< memberships >─ auth.users (Supabase-managed)
organizations ─< properties ─< units ─< spaces
                              spaces ─< assets  (assets can also hang directly off a unit or property)
     assets/spaces/units/properties ─< records >─ record_types
                                        records ─< attachments
                                        records ─< expenses
                              assets ─< warranties
                          properties ─< reminders
organizations ─< vendors  (kind: vendor | contractor | both)
records >─ vendors, records >< tags (via record_tags)
```

Full column-level design lives in `supabase/migrations/0001_init.sql` (the migration file is the single source of truth for schema — this doc describes shape, not exact columns, to avoid drift).

Records are modeled as one flexible table (`records`) referencing a `record_types` lookup, not a bespoke table per record kind (repair/maintenance/inspection/...) — see [ADR 0005](../decisions/0005-flexible-record-modeling.md). Attachments, expenses, and warranties hang off whichever entity they actually belong to via nullable FK columns with a check constraint (exactly one owner set), keeping real referential integrity instead of an untyped polymorphic (`entity_type`, `entity_id`) pair.

## Branding abstraction

See [ADR 0003](../decisions/0003-branding-abstraction.md). One module (`lib/branding.ts`) is the only place the product name/tagline/support email are defined; everything else (metadata, emails, empty states, PDF export headers) imports from it.

## Smart capture / extraction abstraction

See [ADR 0004](../decisions/0004-extraction-provider-abstraction.md). An `ExtractionProvider` interface with a free/local implementation first; a paid vision-model implementation can be added later behind the same interface, selected by config, never required.

## Search

MVP search is structured Postgres search (indexed columns + `pg_trgm`/`tsvector` where useful) across properties, assets, records, vendors. Query layer is isolated behind a single search function/module so a later semantic-search addition (pgvector, or an external index) is an internal swap, not a rewrite of every call site (Phase 9, post-MVP-gate).

## QR assets

Each asset can get an opaque, non-sequential public ID (`asset_public_id`, e.g. a UUID or short random token — never the numeric primary key) used in the QR-encoded URL. The scanned URL requires authentication to view full details in MVP; no private data is exposed to an unauthenticated scanner.

## Folder structure (Next.js app, once scaffolded)

```
app/
  (marketing)/            public marketing site
  (app)/                  authenticated app shell
    dashboard/
    properties/[id]/
    capture/
    reminders/
    search/
    settings/
  api/                    route handlers (webhooks, qr redirect, export)
lib/
  branding.ts
  supabase/               client.ts (browser), server.ts (server components/actions)
  extraction/             ExtractionProvider interface + implementations
  search/
components/
  ui/                     shadcn primitives
supabase/
  migrations/
docs/
```
