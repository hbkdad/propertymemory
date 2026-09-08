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

_None yet. Entries will be appended here as dependencies are introduced, in the form:_

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
