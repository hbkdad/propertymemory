# ADR 0001: Tech stack selection

## Status
Accepted

## Context
Budget is $0. The team is a single autonomous engineering effort (this repo's CLAUDE.md). We need a stack that is production-capable on free tiers, has first-class TypeScript support, and doesn't require managing our own auth/storage/database infrastructure.

## Decision
Next.js (App Router) + TypeScript + React, Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage + RLS), Vercel hosting, PWA support. Zod for validation, React Hook Form for forms, Vitest + RTL + Playwright for testing.

## Alternatives considered
- **Remix / SvelteKit** instead of Next.js: comparable capability, but Next.js + Vercel has the tightest free-tier deployment story and the largest shadcn/ui ecosystem overlap.
- **Firebase** instead of Supabase: Firestore's document model fits this relational, hierarchy-heavy domain (property → unit → space → asset → record) poorly compared to Postgres; Supabase's RLS maps directly onto our multi-tenancy needs with SQL we can read and test.
- **Self-hosted Postgres** (e.g. on Fly.io/Render free tier): more ops burden for no benefit at this stage; Supabase gives us Auth and Storage for free in the same box.
- **Custom auth**: rejected outright — session/security code is exactly where hand-rolling costs the most later.

## Consequences
- We depend on Supabase's and Vercel's free-tier limits (project pause after inactivity, storage/bandwidth caps) — acceptable at pre-revenue scale, revisit at Phase 15 (payments) if it becomes a real constraint.
- RLS-based authorization means schema and security are designed together, not layered on after the fact (see ADR 0002).
