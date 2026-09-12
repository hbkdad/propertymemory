# Threat Model — Property Memory

Status: living document. CLAUDE.md requires this file to exist and to be updated whenever a new attack surface is added (uploads, transfers, public QR pages, natural-language search) — it previously did not exist despite the security-testing phase's work being real; this is that work written up properly, plus the surface Visual Property Mode added. Update this file in the same change that adds a new surface, not after the fact.

## Why this matters for this product specifically

Property records, receipts, and addresses are sensitive personal/financial data even though this isn't a regulated-industry product. A leak here is "a stranger can see where I live, what I own, and what it's worth," not an abstract compliance checkbox.

## Trust model

- **Tenancy root**: `organizations`. A user has no standing access to anything except through a `memberships` row (`role`: `owner` | `admin` | `member`).
- **`owner`/`admin`** vs **`member`**: the distinction only matters for organization-management actions (inviting/removing members, renaming the org) via `is_org_admin()`. Every property/asset/record/attachment/etc. policy uses `is_org_member()` instead — deliberately flat within an org, since this product has no per-property permission tiers (a small landlord's household member and the landlord see the same data).
- **The real boundary is Postgres RLS**, not application code. Every one of the 21 tables in `public` has RLS enabled with a policy scoped through `is_org_member()`/`is_org_admin()` (verified directly against `pg_class`/`pg_policy` during this audit, 2026-09-12 — zero tables found with `relrowsecurity = false`). Server actions add a second, defense-in-depth check (`requireUser()`) but a bug in application code cannot, by itself, leak cross-tenant data — see ADR 0002.
- **Anonymous (unauthenticated) users** can reach: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/error`, and the `/auth/*` routes (email confirmation, password reset landing). Everything else redirects to `/login` at the proxy layer (`src/lib/supabase/proxy.ts`) before any data fetch happens.

## Attack surfaces

### 1. Authentication & session
- **Threat**: session fixation, token leakage, weak passwords, confirmation-link replay.
- **Mitigation**: Supabase Auth handles password hashing/session issuance; `getClaims()` (local JWT signature verification) is used for the proxy's auth check rather than a network round-trip (`getSession()`/`getUser()` are explicitly avoided for this — see comment in `src/lib/supabase/proxy.ts`). Email confirmation required before first login (`enable_confirmations = true`, real project and local stack now consistent — see Issue #19 in STATUS.md for when local drifted from this). Minimum password length 6 (Supabase default) — not increased; acceptable for a pre-launch personal-use product, worth revisiting before wide public launch.
- **Verified**: live two-user signup/confirm/login flow (manual, Verified section of STATUS.md) and automated (`e2e/auth-and-onboarding.spec.ts`).

### 2. Cross-tenant data access (IDOR)
- **Threat**: User B reads/writes User A's organization's data by guessing or enumerating IDs.
- **Mitigation**: RLS on every table (see Trust model above); all primary keys are random UUIDs (`gen_random_uuid()`), never sequential, so guessing is not just blocked but computationally infeasible even if RLS had a gap.
- **Verified**: `supabase/tests/rls_smoke_test.sql` (self-asserting, runs in CI on every push — `rls-smoke-test` job) covers `properties`, `assets`, `extraction_jobs`, and `visual_annotations` as representative tables across select/insert/update/delete; deliberately sabotaged twice during development (once for the original three tables, once for `visual_annotations`) and confirmed the test fails loudly both times. Separately, a live two-user manual IDOR check hit User A's property page, asset page, and all four export routes directly by real UUID as User B and got a clean 404 with empty body every time (not just a 401/403 status — the actual response body was inspected).

### 3. File uploads (attachments, room photos)
- **Threat**: malicious file upload (executable disguised as image, oversized file, MIME-type spoofing), orphaned Storage objects, cross-tenant Storage access.
- **Mitigation**: server-side MIME allow-list (`ALLOWED_ATTACHMENT_TYPES`) and 25MB size cap enforced before the file ever reaches Storage (`src/lib/validations/attachment.ts`), independent of whatever `Content-Type` the browser claims. Storage paths are server-generated (`${organizationId}/${crypto.randomUUID()}-${file.name}`), never client-supplied, and namespaced by organization id as the first path segment. `storage.objects` RLS policies (`attachments_bucket_select/insert/update/delete`) check `is_org_member((storage.foldername(name))[1]::uuid)` — a tenant cannot list, read, or write another tenant's folder even with a guessed/leaked signed URL pattern, because signed URLs themselves are short-lived (300s, see `getAttachmentsByOwner`) and scoped to a specific already-authorized object. A failed DB insert after a successful Storage upload triggers a compensating delete of the orphaned object (`uploadAttachment`, `uploadRoomPhoto`).
- **Visual Mode addition (2026-09-10)**: room/property photos reuse this exact same table and Storage bucket (`attachments.role = 'photo'`), not a parallel upload path — no new surface shape, just a new `role`/`space_id`/`is_cover`/`width_px`/`height_px` set of columns on the same RLS-covered table. Client-side downscaling (`src/lib/image.ts`) reduces the practical size of what's ever uploaded but is a performance measure, not a security control — the server-side cap is still the real boundary.
- **Verified**: a disallowed MIME type was rejected live during the original attachments work; the same allow-list/cap logic was exercised again live during Visual Mode testing (photo upload, delete-then-confirm-Storage-object-removed).

### 4. OCR / smart capture (untrusted extracted content)
- **Threat**: a malicious or malformed photo used to inject content that gets trusted as fact, or to cause a crash/resource exhaustion in the OCR pipeline.
- **Mitigation**: per ADR 0004 and CLAUDE.md's architecture rules, all OCR/AI-extracted content is treated as untrusted input — never auto-saved, always shown back to the user for review/edit before it becomes a real `asset`/`expense` row. `tesseract.js` runs server-side only (confirmed absent from the client bundle via chunk-grep during the performance-optimization phase) via `serverExternalPackages`.
- **Accepted risk, not mitigated**: no rate limiting on the OCR endpoint beyond auth + the existing MIME/size caps. A legitimate authenticated user could run up server compute by scanning repeatedly. Real rate limiting needs a shared store (Redis/Upstash), which conflicts with the zero-capital constraint today. Documented here (and in STATUS.md) as a conscious, accepted limitation, not an oversight — revisit if usage ever approaches a level where it matters.

### 5. Hotspot annotations (Visual Mode, new 2026-09-10)
- **Threat**: a hotspot created by one tenant pointing at another tenant's photo or asset; deleting a hotspot cascading into deleting the underlying asset (a correctness/data-loss concern more than a classic security one, but still a real "did this action do more than the user intended" risk).
- **Mitigation**: `visual_annotations` has the same RLS shape as every other table (`is_org_member(organization_id)` on all four operations) plus foreign keys into `attachments`/`assets` that are themselves RLS-covered, so a cross-tenant reference can't be created even by a compromised client bypassing UI validation — the INSERT itself is rejected at the database layer if `organization_id` doesn't match the caller's own membership, independent of what `attachment_id`/`asset_id` values are supplied. Deleting an annotation only ever touches the `visual_annotations` row (`on delete cascade` runs from `assets`/`attachments` *into* `visual_annotations`, never the reverse) — see ADR 0006's explicit "visual association vs. domain entity" separation.
- **Verified**: `rls_smoke_test.sql`'s `visual_annotations` coverage (see #2 above) includes a malicious-insert attempt using a real, known (guessed) `attachment_id` belonging to the other org, confirmed blocked. Separately, confirmed live: deleting a hotspot and then querying the database directly showed the linked asset's row completely unchanged (name, cost, all fields intact) while the annotation row count dropped to zero.

### 6. QR asset labels / shareable identifiers
- **Threat**: enumerable public URLs exposing tenant data without authentication.
- **Mitigation**: asset URLs use the asset's own random UUID primary key — there is no separate "public" unauthenticated view of an asset page; scanning the QR code takes you to the normal authenticated `/assets/[id]` route, which still requires a valid session and still goes through RLS. There is currently no *intentionally public* page in the product (property transfer, mentioned in the PRD as a post-MVP phase, would be the first one and would need its own opaque-token design when built — see PRD "Property transfer (Phase 8)").
- **Verified**: traced (not just grepped) the `qrcode` package's SVG rendering to confirm it never writes the encoded URL as literal markup, so the two `dangerouslySetInnerHTML` usages in the codebase (`/assets/[id]`, `/assets/[id]/label`) have no XSS path regardless of URL content.

### 7. Exports (CSV/PDF)
- **Threat**: export routes leaking another tenant's data, or including more than the user intended.
- **Mitigation**: export routes query through the same RLS-scoped server client as everything else; no service-role client exists anywhere client-reachable in the codebase (grepped for `service_role`/`SERVICE_ROLE`/`SUPABASE_SECRET` across `src/` during this audit — zero matches).
- **Verified**: live IDOR check (see #2) explicitly included all four export routes.

### 8. Search
- **Threat**: SQL injection via search terms; cross-tenant leakage through search results.
- **Mitigation**: all search queries go through the Supabase query builder's `.ilike()` (parameterized), never raw string-built SQL (grepped for raw template-literal SQL in the search/visual-mode/attachment action files during this audit — none found); results are RLS-scoped like every other query.

### 9. Headers & transport
- **Mitigation**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, a restrictive `Permissions-Policy`, and `frame-ancestors 'none'` set via `next.config.ts`, confirmed present on live responses via `fetch()`.
- **Accepted risk, not mitigated**: no script/style-restricting Content-Security-Policy. Doing this correctly needs nonces threaded through `proxy.ts` and would force every currently-statically-optimized page into dynamic rendering. Deferred as a documented, reasoned tradeoff — there is no third-party script and no unsafe-HTML path already found (see #6), so the marginal benefit today is low relative to the cost. Revisit if third-party scripts are ever added.

### 10. Privileged database functions
- **Threat**: a `SECURITY DEFINER` function being callable in a way that lets a caller act outside their own membership.
- **Status**: `create_organization`, `is_org_admin`, `is_org_member` are all `SECURITY DEFINER` and callable by any authenticated user (flagged by Supabase's own advisor as a WARN). Traced into each function body: all three are hard-scoped to `auth.uid()` — never a caller-supplied user id — so calling any of them only ever answers a question about *the caller's own* membership. `anon` execute is revoked on all three. Confirmed intentional via the real advisor tool + reading the function source (2026-09-12), not just re-running the linter and assuming the WARN is stale.

## Known accepted risks (not gaps — documented tradeoffs)

1. No OCR rate limiting (see #4).
2. No CSP (see #9).
3. Minimum password length is Supabase's default (6 chars), not increased.
4. The real Supabase project's Auth email templates/redirect URLs are still pointed at local dev config pending a real domain — this is a pre-launch blocker tracked in STATUS.md's Next list, not a silent gap.

## Update log

- 2026-09-12: file created (see header note — this should have existed since the original security-testing phase; backfilled here, and the RLS-initplan performance finding on `profiles_update_self` fixed in the same audit pass). Added Visual Mode's surfaces (#3 addition, #5).
