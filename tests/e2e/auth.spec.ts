import { expect, test } from "@playwright/test";
import { configureTestAuthSettings, registerAndLogin } from "./helpers";

test.beforeAll(() => {
  configureTestAuthSettings();
});

test("registers, logs in, and logs out", async ({ page }, testInfo) => {
  await registerAndLogin(page, testInfo, "auth");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  if (await page.getByTestId("account-menu-trigger").isVisible()) {
    await page.getByTestId("account-menu-trigger").click();
    await page.getByTestId("logout-button").click();
  } else {
    await page.getByTestId("mobile-nav-logout").click();
  }
  await expect(page).toHaveURL(/\/login\?logout=1/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("shows a useful failed login state", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("missing-user@triptally.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});
