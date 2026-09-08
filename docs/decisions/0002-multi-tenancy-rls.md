# ADR 0002: Multi-tenancy via Supabase Row Level Security

## Status
Accepted

## Context
Property/asset/financial data is sensitive and belongs to a specific person or organization. The application must never let one tenant see or modify another's data, including through bugs in application code — a frontend filter or an unguarded server action is not an acceptable security boundary for this kind of data.

## Decision
- Tenancy root is `organizations`. Every user reaches data only via a row in `memberships` (`user_id`, `organization_id`, `role`).
- Every tenant-scoped table has RLS **enabled** and a policy scoped through membership, using a `SECURITY DEFINER` helper function (`is_org_member(org_id uuid)`) shared across policies rather than duplicating the membership subquery in every policy.
- RLS ships in the same migration that creates the table — a table is never live without it.
- Authorization is checked **twice**: RLS in Postgres (the real boundary, holds even if application code has a bug) and a server-side membership check in the server action/route handler before it touches the table (defense in depth, and lets us return a clean 403 instead of a silent empty result).
- Storage buckets get equivalent policies keyed off the same membership relationship — an attachment's storage path is never guessable/listable across tenants.

## Alternatives considered
- **Application-layer-only authorization** (filter every query by org_id in code): rejected — one missed `WHERE` clause anywhere in the codebase becomes a cross-tenant data leak. RLS makes the leak structurally impossible at the database layer.
- **Separate database/schema per tenant**: massive operational overhead for a single-founder, $0-budget project; unnecessary at this scale and blocks cross-property features (global search, portfolio views) for landlords/property managers.

## Consequences
- Every new table's migration must include its RLS policy — this is a hard rule in CLAUDE.md, not a suggestion.
- We need automated tests that assert cross-tenant access actually fails (User A cannot read/write User B's org data, unauthorized storage files are unreachable) — see `docs/testing/` and Phase 13/Phase 11 of the project brief.
- Query patterns must go through the Supabase server client that carries the authenticated session (so `auth.uid()` is available to policies) — never a service-role client from user-facing request paths.
