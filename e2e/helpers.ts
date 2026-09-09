import { expect, type Page } from "@playwright/test";

// Local Supabase's Mailpit instance (see supabase/config.toml [local_smtp] --
// the CLI still calls the section "smtp"/"inbucket" in places, but the
// running service and its REST API are Mailpit's). Never point this at a
// real mailbox: these tests only work because local dev email is trapped
// here instead of actually sent.
const MAILPIT_URL = "http://127.0.0.1:55324";

export const TEST_PASSWORD = "TestPass123!";

export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Polls Mailpit for the most recent message to `email` and pulls the
 * confirmation link's href out of the HTML body. Retries because the
 * message can take a moment to land after the signup request resolves.
 */
async function getConfirmationLink(email: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const searchRes = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
    );
    const search = await searchRes.json();
    if (search.messages?.length > 0) {
      const id = search.messages[0].ID;
      const messageRes = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
      const message = await messageRes.json();
      const match = /href="([^"]*\/auth\/confirm\?[^"]*)"/.exec(message.HTML);
      if (match) {
        return match[1].replace(/&amp;/g, "&");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No confirmation email arrived for ${email} within 15s`);
}

/**
 * Full signup -> confirm -> onboarding flow, ending on the dashboard with
 * one property already created. Returns the credentials so a test can log
 * back in later.
 */
export async function signUpAndOnboard(
  page: Page,
  options: { label: string; propertyName: string }
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(options.label);
  const password = TEST_PASSWORD;

  await page.goto("/signup");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();

  const confirmLink = await getConfirmationLink(email);
  await page.goto(confirmLink);

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.fill("#accountName", `${options.label} household`);
  await page.fill("#propertyName", options.propertyName);
  await page.getByRole("button", { name: "Create my property" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: options.propertyName })).toBeVisible();

  return { email, password };
}

export async function logIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
