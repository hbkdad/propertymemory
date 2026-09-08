# Product Roadmap

## MVP (release-gated — see checklist below)

Auth · onboarding · properties/units/spaces · assets · records timeline · attachments · expenses · warranty tracking · maintenance reminders · global structured search · smart capture (free/local baseline) · QR asset identifiers · PDF/CSV export · PWA.

## Post-MVP, prioritized by measured demand (not built speculatively)

1. Better OCR accuracy for smart capture.
2. AI-assisted structured extraction (optional paid provider tier, behind the existing `ExtractionProvider` abstraction).
3. Natural-language property search.
4. Property transfer workflow (schema exists from MVP; UI/flow ships after).
5. Contractor-facing portals (Persona D).
6. Recurring maintenance templates (pre-built reminder sets per asset category).
7. Insurance inventory reports.
8. Advanced expense reporting.
9. Landlord portfolio tools (cross-property dashboards, standardized bulk export).
10. Native mobile app — only if the PWA demonstrably hits a hard platform limitation.

## MVP release gate

Not release-ready until all of the following are true and verified (not assumed):

- [ ] Authentication works end-to-end (signup/login/logout/reset)
- [ ] Multi-tenancy is protected (automated cross-tenant RLS tests pass)
- [ ] Property CRUD works
- [ ] Unit/space hierarchy works
- [ ] Asset management works
- [ ] Record timeline works
- [ ] Attachment uploads work
- [ ] Expenses work
- [ ] Warranties work
- [ ] Reminders work
- [ ] Global search works
- [ ] QR generation works
- [ ] PDF/CSV export works
- [ ] PWA is installable
- [ ] Mobile flow verified in-browser at 390/768/1024/1440
- [ ] Tenant-isolation tests pass
- [ ] Production build passes
- [ ] Critical E2E tests pass (see `docs/testing/`)
- [ ] No known critical security issue remains
- [ ] Environment setup documented (`README.md`)
- [ ] Deployment procedure documented (`docs/DEPLOYMENT.md`)

Track current status against this list in [docs/STATUS.md](STATUS.md).
