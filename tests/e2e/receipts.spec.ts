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

test("receipt upload UI is hidden when the feature flag is disabled", async ({
  page
}, testInfo) => {
  await registerAndLogin(page, testInfo, "receipts");
  await createTripWithParticipants(page, uniqueLabel(testInfo, "Receipt Trip"));

  await expect(page.getByRole("link", { name: "Upload Receipt" })).toHaveCount(0);
  await page.goto(`${page.url().replace(/\\?.*$/, "")}/receipts/new`);
  await expect(page.getByRole("heading", { name: "This page is not available." })).toBeVisible();
});
