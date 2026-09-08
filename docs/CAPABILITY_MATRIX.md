# Capability Matrix

Audited 2026-09-08 on the initial clone of this repository. Re-run the checks below and update this file whenever the toolchain changes materially (new machine, CI runner, major version bump).

Host: Windows 11 Enterprise 10.0.26200, PowerShell (primary) + Git Bash. Working directory: repo root.

## Source control & hosting

| Capability | Detected tool | Version | Availability | Authenticated | Purpose | Required/Optional | Fallback |
|---|---|---|---|---|---|---|---|
| Version control | Git | 2.54.0.windows.1 | ✅ installed | n/a (local) | All source history | Required | none needed |
| GitHub hosting | `gh` CLI | logged in as `hbkdad` | ✅ installed | ✅ scopes: gist, read:org, repo, workflow | Repo/PR/issue ops from the shell | Required | GitHub MCP plugin (`plugin:engineering:github`) — **not authenticated**, would need `/mcp` setup |
| Git identity | `git config` | user.name=hbkdad, user.email=93459210+hbkdad@users.noreply.github.com | ✅ set | n/a | Commit authorship | Required | none needed |
| CI/CD | GitHub Actions | n/a | Available (repo is on github.com) | n/a | Lint/typecheck/test/build gate (Phase 19) | Required before MVP gate | none |

## Runtime & package management

| Capability | Detected tool | Version | Availability | Authenticated | Purpose | Required/Optional | Fallback |
|---|---|---|---|---|---|---|---|
| JS runtime | Node.js | v24.15.0 | ✅ | n/a | Next.js app runtime | Required | none |
| Package manager (primary) | pnpm | 11.5.2 | ✅ | n/a | Install/scripts, workspace mgmt | Required | npm (present, 11.12.1) |
| Package manager (alt) | npm | 11.12.1 | ✅ | n/a | Fallback / one-off `npx` calls | Optional | — |
| Fast runtime/test alt | Bun | 1.3.13 | ✅ | n/a | Optional speed-up for scripts | Optional | pnpm/node |
| Containers | Docker | 29.6.2 | ✅ | n/a | Local Supabase stack (Postgres/Auth/Storage) for migration testing without touching the cloud project | Required for local DB verification | Test migrations directly against a disposable cloud branch instead |

## Database & backend (Supabase)

| Capability | Detected tool | Version | Availability | Authenticated | Purpose | Required/Optional | Fallback |
|---|---|---|---|---|---|---|---|
| Supabase CLI (global binary) | `supabase` | — | ❌ not found on PATH | n/a | Local dev stack, migrations, type gen | Required (one form of it) | `pnpm dlx supabase` (no global install needed) |
| Supabase MCP connector | `mcp__208314b3…` tools | n/a | ✅ connected | ✅ authenticated as org `jecllmvbkiwhorczibxt` (HBKcustoms) | Direct project/migration/advisor management from this session | Required | Supabase CLI via `pnpm dlx` |
| Existing Supabase projects | — | — | 5 found: `hbk-app-v3`, `SafeSpace`, `ForgeQuote`, `astrolapp`, `astrasequence` — all **INACTIVE** (free-tier auto-pause) | ✅ | Unrelated prior projects under the same account | n/a | **No project exists yet for this product** — a new one needs to be created (pending go-ahead, since it's a persistent cloud resource) |
| Postgres | via Supabase | 17.x (matches existing projects) | Will provision new | — | Primary datastore | Required | — |

## Deployment (Vercel)

| Capability | Detected tool | Version | Availability | Authenticated | Purpose | Required/Optional | Fallback |
|---|---|---|---|---|---|---|---|
| Vercel CLI | `vercel` | 54.9.1 | ✅ installed | Not checked via CLI (see MCP row) | Local deploy/preview | Optional (MCP covers this) | — |
| Vercel MCP connector | `mcp__3c9d18a3…` tools | n/a | ✅ connected | ✅ team "Michel Lavigne's projects" (hobby plan) | Project creation, deployments, logs, domains from this session | Required | Vercel CLI |

## Testing & quality

| Capability | Detected tool | Version | Availability | Purpose | Required/Optional | Fallback |
|---|---|---|---|---|---|---|
| Unit/component tests | Vitest + React Testing Library | not yet installed | — | Business logic + component tests | Required (Phase 13) | add as devDependency at scaffold time |
| E2E tests | Playwright | not yet installed | — | Signup→property→asset→record flows | Required (Phase 13) | add as devDependency; browser binaries fetched on first `playwright install` |
| Lint/format | ESLint, Prettier | ships with Next.js scaffold | — | Code quality gate | Required | — |
| Type safety | TypeScript strict mode | ships with Next.js scaffold | — | Compile-time correctness | Required | — |
| Visual QA | In-app Browser tool (`mcp__Claude_Browser__*`) | n/a | ✅ available by default | Responsive QA at 1440/1024/768/390 | Required (Phase 13 visual QA) | Claude in Chrome MCP (also available, uses real Chrome profile — not needed here) |

## Claude Code capabilities (this session)

| Capability | Status | Purpose |
|---|---|---|
| Subagents (`Agent` tool) | Available: `general-purpose`, `Explore`, `Plan`, `website-builder`, `claude-code-guide`, `zapier` specialist | Parallelizing independent, well-scoped chunks of work. No pre-built "Architecture/Security/QA agent" roles exist — those are emulated via scoped `general-purpose` agent prompts when useful. |
| Agent Skills | Large library available (design, ui-styling, ui-ux-pro-max, dataviz, security-review, code-review, run, artifact-design/-diagramming/-capabilities, token-optimizer, engineering:* workflow skills, etc.) | Will invoke by name where they materially help (e.g. `security-review` before the security phase, `run` to launch/screenshot the app, `dataviz`/`artifact-design` if we build reporting dashboards). |
| Hooks | None configured yet (`.claude/settings.json` does not exist) | Could add a pre-commit lint/typecheck hook later; not required for MVP. |
| MCP: Figma, Canva, Notion, Slack, Gmail, Linear, etc. | Listed as requiring OAuth in `claude mcp`/connector settings — **not authenticated** | Not needed for MVP; flagged only in case design handoff (Figma) becomes useful later. |
| Browser automation | In-app Browser pane (`mcp__Claude_Browser__*`) | Local dev server preview + responsive QA. No dev server needs to be publicly reachable. |

## Summary of blockers

None block starting work. Two items are **explicit go/no-go decisions for the user** before they happen (both are persistent, shared-state, or account-affecting actions per this session's operating rules), not technical blockers:

1. **Pushing commits** to `github.com/hbkdad/propertymemory` (public-facing, shared state).
2. **Creating a new Supabase project** (a persistent cloud resource on the existing account, even on the free tier) and applying the first migration to it.

Everything else (docs, schema design, local app scaffold, local migration testing via Docker) can proceed without further input.
