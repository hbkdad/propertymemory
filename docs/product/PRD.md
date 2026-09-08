# Product Requirements — Property Memory (working title: HouseFile)

Status: MVP scoping. See [docs/STATUS.md](../STATUS.md) for current build state.

## Problem

Physical properties accumulate fragmented knowledge that lives nowhere durable: a paint colour known only because someone remembers it, a furnace filter size on a sticky note, a warranty card in a drawer, a receipt in an email that gets deleted, a contractor's name that leaves with the person who hired them. When an appliance breaks, a house sells, or an insurer asks a question, that knowledge is gone or takes hours to reassemble.

Representative questions the product must be able to answer:

- What paint colour is this wall? Which furnace filter does this unit use?
- When was the furnace installed? Where is its warranty? Who serviced it, and for how much?
- What replacement part was used? Which appliances are approaching warranty expiration?
- Where is the receipt? What renovations happened in a given year?
- How much maintenance has this property had? What's due next month?
- What should go to the insurer? What should transfer to a buyer?
- Which contractor repaired the plumbing? What's the dishwasher's serial number?

## One-sentence value proposition

**Your property remembers everything.**

## Design principle

The product must feel dramatically simpler than property-management software — understandable in about five seconds. The interaction model is **Capture → Organize → Remember → Find**. Ease of use is not traded away for feature count.

## Explicit non-goals (MVP and beyond, unless demand proves otherwise post-launch)

Not rent collection, tenant screening, payroll, full double-entry accounting, listing syndication, banking/payments infrastructure, or a general CRM. This product does not compete with Buildium, AppFolio, QuickBooks, RentRedi, or Propertyware — it is not an early version of one.

## Personas

### A — Homeowner (primary MVP persona)
Needs: home-maintenance memory, appliance history, renovation records, warranties, receipts, manuals, service history, reminders. Single property, low complexity, wants confidence that "everything about my house is in one place."

### B — Small landlord
Needs: multiple properties, rental units, room/asset organization, maintenance history, contractor records, tax-supporting expense records, warranty history, repair documentation. Comfortable with slightly more structure (units within properties) than persona A.

### C — Property manager
Needs: larger portfolio, filtering across many properties, standardized records, document exports, maintenance overview. Same data model as B at larger scale — no separate feature set required for MVP.

### D — Contractor (future expansion — do not let this bloat MVP)
Needs (later): customer property records, installations, service history, equipment labels, future service opportunities. MVP ships nothing contractor-facing beyond being recorded as a vendor/contractor on records.

## Information hierarchy

```
User
 └─ Organization/Account   (tenancy root)
     └─ Property
         └─ Unit                (optional — a single-family home may skip this)
             └─ Space/Room
                 └─ Asset
                     └─ Record   (maintenance, repair, inspection, installation,
                                  replacement, renovation, receipt, warranty,
                                  manual, paint/material, general note)
                         └─ Attachment
```

Records may attach at the property, unit, space, or asset level directly — not everything requires drilling down to an asset (e.g., "repainted the hallway" is a space-level record, not asset-level).

## MVP feature scope (see docs/architecture/ARCHITECTURE.md for schema/implementation)

1. Auth (email signup/login/logout/reset).
2. Onboarding — homeowner/landlord/manager + first property, minimal questions.
3. Properties, units, spaces — CRUD.
4. Assets — CRUD with photo, category, manufacturer, model, serial, dates, cost, vendor, notes.
5. Records — timeline entries (repair/maintenance/inspection/installation/replacement/renovation), associated at property/unit/space/asset level.
6. Documents — upload/associate images, receipts, invoices, manuals, warranties, PDFs.
7. Expenses — amount, tax, date, vendor, category, links to property/record/attachment. Not bookkeeping.
8. Warranty tracking — start/expiry, provider, claim reference, attachment.
9. Maintenance reminders — one-time and recurring.
10. Global search — properties, addresses, units, spaces, assets, manufacturers, models, serials, notes, vendors, contractors, record descriptions, document metadata. Architected so semantic/NL search can be added later without a rewrite.
11. Smart capture — receipt/appliance-label/paint-can/invoice extraction behind a provider-agnostic abstraction, with a working free/local baseline and a mandatory user-review step before anything extracted is saved as fact.
12. QR asset identifiers — opaque IDs, printable labels, authenticated asset detail page on scan.
13. Export — property report PDF (selectable scope, no automatic inclusion of sensitive material) and CSV.
14. PWA — installable, responsive, offline-friendly shell.

Property transfer (Phase 8) and natural-language search (Phase 9) are architected for but are explicitly post-MVP-gate features — see `docs/PRODUCT_ROADMAP.md` (created alongside the architecture doc).

## Success signals (for the funnel design, not vanity metrics)

landing → signup → first property created → first asset created → first receipt/document saved → first reminder created → repeat visit → paid conversion.

## Pricing shape (experimental, not final — see Phase 15 in the original project brief)

Free (1 property, basic records, limited storage) → Landlord (~$8.99/mo) → Pro (~$14.99/mo) → Business (~$29/mo). Implemented as feature-entitlement checks against a plan record, not scattered `if plan === …` conditionals — billing must not block core MVP development and can run in a mocked/dev mode until Stripe credentials exist.
