# ADR 0004: Extraction/OCR sits behind a provider abstraction, free by default

## Status
Accepted

## Context
Smart capture (reading a receipt, an appliance label, a paint can, a contractor invoice) is a strong product differentiator, but the zero-capital constraint means no paid API can be required for the app to function. We also must never let extracted or uploaded document content be trusted or executed as instructions — it's untrusted input like any other user upload.

## Decision
- Define an `ExtractionProvider` interface (e.g. `extractReceipt`, `extractApplianceLabel`, `extractPaintCan`, `extractInvoice`) returning a typed, partial result plus a confidence/provenance marker. No feature code calls a vendor SDK directly.
- Ship a free/local baseline implementation first (browser-side or lightweight server-side OCR) so the feature works with zero paid keys configured.
- A paid, vision-capable provider implementation can be added later behind the same interface, selected via config/environment, purely additive — never a hard dependency.
- Every extraction result is shown to the user on a review screen ("Extracted Information") for confirmation/edit before it's saved as fact. Nothing from OCR/AI extraction is auto-committed.
- Extracted/uploaded content is treated as data, not instructions — it cannot trigger actions on its own, and if a natural-language search layer is added later (Phase 9), tenant data is never sent to an external model without minimizing what's transmitted and never mixing another tenant's context into a request.

## Alternatives considered
- **Require a paid vision API from day one**: rejected outright by the zero-capital constraint — it would make the core loop (capture → organize) depend on a cost center before there's revenue.

## Consequences
- The free/local baseline may have lower extraction accuracy than a paid model — acceptable because the review-before-save step means accuracy is a UX-speed concern, not a correctness risk.
- Provider choice is a config value, so upgrading a single tenant or the whole app to a paid provider later is additive, not a rewrite.
