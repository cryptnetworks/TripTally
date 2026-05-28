import { expect, test } from "@playwright/test";
import { configureTestAuthSettings, registerAndLogin } from "./helpers";

test.beforeAll(() => {
  configureTestAuthSettings();
});

test("adds a payment profile and rejects unsafe URLs", async ({ page }, testInfo) => {
  await registerAndLogin(page, testInfo, "payments");

  await page.goto("/account");
  await page.getByLabel("Provider").selectOption("venmo");
  await page.getByLabel("Label").fill("Travel Venmo");
  await page.getByLabel("Handle or email").fill("@traveler");
  await page.getByRole("button", { name: "Add payment method" }).click();
  await expect(page.getByText("Travel Venmo")).toBeVisible();

  await page.getByLabel("Label").fill("Unsafe");
  await page.getByLabel("Handle or email").fill("");
  await page.getByLabel("Payment link").fill("ftp://example.com/pay");
  await page.getByRole("button", { name: "Add payment method" }).click();
  await expect(page.getByText("Check the payment method details and try again.")).toBeVisible();
});
