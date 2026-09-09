import { expect, test } from "@playwright/test";
import { signUpAndOnboard } from "./helpers";

// UI-level companion to supabase/tests/rls_smoke_test.sql: that script
// proves the database rejects cross-tenant access at the SQL layer, this
// proves a real request through the actual app -- browser, routing, auth
// cookies and all -- comes back as a clean 404, not a leak or a crash.
// Mirrors the manual two-user IDOR check documented in docs/STATUS.md's
// Security testing section, but automated and repeatable.
test("a signed-in user cannot reach another org's property by URL", async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await signUpAndOnboard(pageA, { label: "tenant-a", propertyName: "Org A House" });
  const propertyUrl = pageA.url();
  expect(propertyUrl).toMatch(/\/dashboard$/);

  // Next.js <Link> navigation is client-side (history.pushState), so
  // pageA.url() read synchronously right after click() can still show the
  // pre-navigation URL -- wait for it to actually land first.
  await pageA.getByRole("link", { name: "Org A House" }).click();
  await pageA.waitForURL(/\/properties\//);
  const orgAPropertyUrl = pageA.url();
  await contextA.close();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await signUpAndOnboard(pageB, { label: "tenant-b", propertyName: "Org B House" });

  const response = await pageB.goto(orgAPropertyUrl);
  expect(response?.status()).toBe(404);
  await contextB.close();
});
