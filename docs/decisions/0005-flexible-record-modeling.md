# ADR 0005: Flexible record modeling instead of a table per record type

## Status
Accepted

## Context
The domain brief lists many record kinds — maintenance, repair, inspection, installation, replacement, renovation, receipt, warranty (as a record), manual, paint/material, general note — plus two similarly-shaped service-provider concepts (vendors and contractors). A naive design creates a table per kind, most of which would share 90% of their columns.

## Decision
- One `records` table carries all timeline entries, with a `record_type_id` referencing a small `record_types` lookup table (seeded with the kinds above, extensible without a migration touching application tables).
- `records` attaches to whichever level of the hierarchy it actually describes — property, unit, space, or asset — via nullable FK columns with a check constraint requiring exactly one owner. This models the real fact that "repainted the hallway" is space-level, not asset-level, without forcing every record to a leaf asset.
- `vendors` and `contractors` from the brief are unified into one `vendors` table with a `kind` enum (`vendor | contractor | both`), since both are "a business associated with a record" and duplicating CRUD/schema for a label difference would violate the anti-premature-complexity rule in CLAUDE.md.
- Warranties and expenses remain their **own** tables (not folded into `records`) because they carry structurally distinct, required fields (expiry date + provider; amount + tax + category) that are used in dedicated views (expiring-warranties list, expense reports) — flattening them into a generic record with a JSON blob would make those views and their indexes worse, not simpler.

## Alternatives considered
- **A table per record type**: rejected — ~10 near-identical tables, ~10 near-identical RLS policy sets, and a UI that has to branch on table identity instead of a `record_type` value.
- **Fully generic EAV (entity-attribute-value) modeling for everything, including warranties/expenses**: rejected — loses indexability and type safety for the two record-adjacent concepts (warranties, expenses) that are queried and aggregated on their own (expiring soon, spent this year), where a real column beats a key-value row every time.

## Consequences
- Adding a new record type (e.g. "inspection" becoming its own richer concept later) is a data change (`record_types` row) until/unless it earns structurally distinct fields, at which point it graduates to its own table — same reasoning as warranties/expenses.
- `records` needs a partial index or check-constraint discipline to keep the "exactly one owner" invariant enforced at the database level, not just in application code.
