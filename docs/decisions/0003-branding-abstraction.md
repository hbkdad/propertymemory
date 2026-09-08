# ADR 0003: Branding must be renameable without a refactor

## Status
Accepted

## Context
"HouseFile" / "Property Memory" is an explicit working title. The product may be renamed before or at launch. Discovering the name hardcoded across 200 components, email templates, and PDF headers at rename time would be a real, avoidable cost.

## Decision
- A single module (`lib/branding.ts`) exports the product name, short tagline, support email, and any other brand string used in more than one place. Everything else (page metadata, empty states, email templates, PDF/CSV export headers, the PWA manifest) imports from it — no literal brand strings elsewhere.
- Technical identifiers chosen now (npm package name, Postgres schema/table names, the GitHub repo name `propertymemory`) are allowed to stay as-is through a rename — they're not user-facing and renaming them later is a non-event precisely because no user-facing logic depends on the *name* rather than the *identifier*.
- The PWA manifest name/icons are generated from the branding module at build time, not hand-maintained separately.

## Alternatives considered
- **i18n-style string catalog for all copy**: overkill for a rename concern specifically; full i18n is a separate, larger decision to make later if/when the product needs multiple languages.

## Consequences
- Any PR introducing a literal "HouseFile" or "Property Memory" string outside `lib/branding.ts` (or docs, which are allowed to reference the working title) is a review finding, not a style nitpick.
