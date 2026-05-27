import { expect, test } from "@playwright/test";

test("mobile user can register, create a trip, add a participant, and add an expense", async ({
  page
}) => {
  const unique = Date.now();
  const email = `mobile-${unique}@triptally.test`;
  const password = "TestPass123";

  await page.goto("/register");
  await page.getByLabel("Username").fill(`mobile${unique}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link", { name: "Create Trip" }).click();
  await page.getByLabel("Trip name").fill("Mobile Test Trip");
  await page.getByLabel("Destination").fill("Portland");
  await page.getByLabel("Start date").fill("2026-07-01");
  await page.getByLabel("End date").fill("2026-07-04");
  await page.getByRole("button", { name: "Save trip" }).click();

  await expect(page.getByRole("heading", { name: "Mobile Test Trip" })).toBeVisible();
  await page.getByPlaceholder("Name").fill("Alice");
  await page.getByPlaceholder("Email optional").fill("alice@example.com");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(
    page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Participants" }) })
      .getByText("Alice", { exact: true })
  ).toBeVisible();
  await page.getByRole("link", { name: "Add Expense" }).first().click();
  await page.getByLabel("Title").fill("Coffee");
  await page.getByLabel("Amount").fill("12.50");
  await page.getByLabel("Date").fill("2026-07-02");
  await page.getByRole("button", { name: "Record expense" }).click();

  await expect(page.getByText("Coffee")).toBeVisible();
  await expect(page.getByText("$12.50").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Balances" })).toBeVisible();
});
