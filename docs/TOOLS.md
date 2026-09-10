# Third-Party Tooling Log

Tracks every external tool/MCP server/package added to this project beyond the language/framework baseline, and why. See [CAPABILITY_MATRIX.md](CAPABILITY_MATRIX.md) for the full environment audit.

## Vetting checklist (apply before adding anything new)

1. What problem does it solve that isn't already covered?
2. Reputation/maintenance activity of the source.
3. What permissions/filesystem/network access does it request?
4. Dependency/security concerns (transitive deps, known CVEs).
5. Confirm the capability isn't already present in the audited environment.
6. Document the justification here before or immediately after adding it.
7. Never commit secrets required to use it — add placeholders to `.env.example` instead.
8. Prefer free-tier/open-source options first (zero-capital constraint).

## Already present (not newly installed — pre-existing account connections)

| Tool | Why it's in use | Notes |
|---|---|---|
| Supabase MCP connector | Direct, auditable project/schema/migration management from inside Claude Code, avoids hand-rolling a CLI wrapper | Connected to an existing account with 5 unrelated projects; a new project will be created specifically for this product |
| Vercel MCP connector | Deployment, logs, and domain management from inside Claude Code | Connected to existing "Michel Lavigne's projects" team (hobby plan) |
| GitHub CLI (`gh`) | Repo/PR/issue operations | Already authenticated; no MCP GitHub plugin needed |

## Added during development

_Entries below were backfilled on 2026-09-10 while auditing this file for the visual-mode phase -- they should have been logged when each package was actually added (smart capture / export / QR phases) rather than after the fact. Recorded here now so the log is accurate going forward; treat the "Added" date as when each package first shipped, not when it was written up._

### tesseract.js / tesseract.js-core
- Added: 2026-09-08, smart capture (OCR) phase
- Problem it solves: free/local text extraction from appliance-label and receipt photos, satisfying ADR 0004's requirement that the app work fully with zero paid AI keys configured.
- Alternatives considered: a paid cloud OCR API (Google Vision, AWS Textract) -- rejected as the *default*, since it would violate the zero-capital constraint; the `ExtractionProvider` interface leaves room for one later as an optional, non-mandatory upgrade.
- License / cost tier: Apache-2.0, free, runs entirely server-side (no client bundle cost -- confirmed via a chunk-grep during the performance-optimization phase, see `docs/STATUS.md`).
- Footprint: needed `serverExternalPackages` in `next.config.ts` (see `docs/STATUS.md` Issue #9) since it resolves a worker script via a real filesystem path that bundlers otherwise rewrite incorrectly.

### @react-pdf/renderer
- Added: 2026-09-08, export phase
- Problem it solves: generates the property PDF report (assets/history/warranties/expenses) server-side, without a headless-browser dependency (Puppeteer et al., which would need more memory/compute than a $0 hosting tier comfortably provides).
- Alternatives considered: server-side Puppeteer/Playwright PDF generation -- rejected as heavier and less suited to a serverless/edge-friendly deploy target.
- License / cost tier: MIT, free.
- Footprint: server-only usage (the export route handlers), confirmed absent from the client bundle in the same chunk-grep as above.

### qrcode
- Added: 2026-09-08, QR asset identifiers phase
- Problem it solves: generates the QR code + printable label linking a physical asset to its `/assets/[id]` page.
- Alternatives considered: none seriously -- this is a narrow, well-solved problem where a small, focused library beats hand-rolling QR encoding.
- License / cost tier: MIT, free.
- Footprint: its SVG renderer was specifically traced (not just grepped) during the security-testing phase to confirm it never writes the encoded URL as literal markup, so there's no XSS path through `dangerouslySetInnerHTML` regardless of what the URL contains (see `docs/STATUS.md` Security testing section).

_Further entries will be appended here as new dependencies are introduced, in the form:_

```
### <package/tool name>
- Added: <date>, Phase <n>
- Problem it solves:
- Alternatives considered:
- License / cost tier:
- Footprint (deps, permissions):
```

## Explicitly avoided

| Tool | Why avoided |
|---|---|
| Any ChatGPT/OpenAI Codex integration | Out of scope by project mandate — this repo is built and maintained solely through Claude Code's own agents/skills/MCP tooling. |
| Paid AI/vision APIs as a hard dependency | Zero-capital constraint — any AI-assisted extraction must have a free/local baseline and treat paid providers as an optional enhancement behind a provider abstraction. |
| Full accounting/CRM/tenant-screening/rent-collection libraries | Explicitly out of MVP scope — HouseFile/Property Memory is a property history & memory tool, not a property-management suite. |
