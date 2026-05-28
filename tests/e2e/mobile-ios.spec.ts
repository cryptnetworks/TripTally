import { expect, test } from "@playwright/test";
import {
  configureTestAuthSettings,
  createTripWithParticipants,
  registerAndLogin,
  uniqueLabel
} from "./helpers";

test.beforeAll(() => {
  configureTestAuthSettings();
});

test("iPhone WebKit user can add a decimal expense", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "Mobile Safari", "Mobile Safari regression coverage only.");

  await registerAndLogin(page, testInfo, "ios-expense");
  await createTripWithParticipants(page, uniqueLabel(testInfo, "iOS Trip"));

  await page.getByRole("link", { name: "Add Expense" }).first().tap();
  await page.getByLabel("Title").fill("iOS Coffee");
  await page.getByLabel("Amount").fill("12.50");
  await expect(page.getByTestId("expense-amount")).toHaveAttribute("inputmode", "decimal");
  await page.getByLabel("Date").fill("2026-07-02");
  await page.getByRole("button", { name: "Record expense" }).tap();

  await expect(page.getByText("iOS Coffee")).toBeVisible();
  await expect(page.getByText("$12.50").first()).toBeVisible();
});
