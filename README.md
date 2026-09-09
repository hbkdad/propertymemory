# HouseFile (working title)

Your property remembers everything.

HouseFile is the organized history of a home or rental property -- every appliance, repair, warranty, and receipt, searchable in one place. It's not property-management software: no rent collection, no accounting, no tenant screening. Just capture, organize, remember, find.

See [docs/product/PRD.md](docs/product/PRD.md) for the full product spec and [docs/STATUS.md](docs/STATUS.md) for exactly what's built and verified right now.

## Stack

Next.js (App Router) + TypeScript + React, Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage), Vercel, installable as a PWA. Zero paid dependencies -- everything, including smart-capture OCR, runs on free tiers. See [docs/decisions/](docs/decisions/) for the reasoning (ADR 0001) and [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for how it fits together.

## Local development

```bash
pnpm install
supabase start          # local Postgres/Auth/Storage via Docker
cp .env.example .env.local   # fill in the local stack's URL/key (see supabase start's own output)
pnpm dev                # http://localhost:3000
```

Other commands:

```bash
pnpm test       # Vitest unit tests
pnpm test:e2e   # Playwright E2E (needs the local stack running, see docs/testing/)
pnpm build      # production build
pnpm lint       # ESLint
```

`supabase/tests/rls_smoke_test.sql` is a cross-tenant RLS isolation check, self-asserting and run automatically in CI -- see `docs/testing/README.md` for how to also run it manually against the local stack.

## Docs

- [docs/product/PRD.md](docs/product/PRD.md) -- problem, scope, non-goals
- [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) -- phased build plan
- [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) -- system design
- [docs/decisions/](docs/decisions/) -- ADRs for the non-obvious calls
- [docs/STATUS.md](docs/STATUS.md) -- living log of what's built, verified, and known-broken
