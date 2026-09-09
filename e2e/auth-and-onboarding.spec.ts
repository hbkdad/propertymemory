import { expect, test } from "@playwright/test";
import { logIn, signUpAndOnboard } from "./helpers";

test("sign up, confirm by email, onboard, log out, and log back in", async ({ page }) => {
  const { email, password } = await signUpAndOnboard(page, {
    label: "auth",
    propertyName: "12 Main Street",
  });

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page, email, password);
  await expect(page.getByRole("link", { name: "12 Main Street" })).toBeVisible();
});
