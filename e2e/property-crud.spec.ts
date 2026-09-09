import { expect, test } from "@playwright/test";
import { signUpAndOnboard } from "./helpers";

test("add, edit, and delete a property from the dashboard", async ({ page }) => {
  await signUpAndOnboard(page, { label: "crud", propertyName: "First Property" });

  // Add a second property.
  await page.getByRole("link", { name: "+ Add a property" }).click();
  await page.fill("#name", "Second Property");
  await page.getByRole("button", { name: "Add property" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Second Property" })).toBeVisible();

  // Edit it.
  await page.getByRole("link", { name: "Second Property" }).click();
  await expect(page.getByRole("heading", { name: "Second Property" })).toBeVisible();
  await page.fill("#name", "Renamed Property");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Renamed Property" })).toBeVisible();

  // Delete it -- two-step confirmation, not a native confirm() dialog
  // (see docs/STATUS.md Issue #5).
  await page.getByRole("button", { name: "Delete property" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Renamed Property" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "First Property" })).toBeVisible();
});
