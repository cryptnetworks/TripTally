import { expect, test } from "@playwright/test";
import { configureTestAuthSettings } from "./helpers";

test.beforeAll(() => {
  configureTestAuthSettings();
});

test("test OAuth provider creates a server-side session after callback", async ({ page }) => {
  await page.goto("/api/auth/oauth/test/start");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("OAuth callback rejects missing callback parameters", async ({ page }) => {
  await page.goto("/api/auth/oauth/test/callback");
  await expect(page).toHaveURL(/\/login\?oauth=invalid/);
  await expect(page.getByText("OAuth sign-in failed: invalid.")).toBeVisible();
});

test("OAuth callback rejects state mismatch", async ({ page }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.context().addCookies([
    { name: "oauth_state_test", value: "expected-state", url: baseURL, sameSite: "Lax" },
    { name: "oauth_pkce_test", value: "expected-verifier", url: baseURL, sameSite: "Lax" }
  ]);

  await page.goto("/api/auth/oauth/test/callback?code=test-oauth-code&state=wrong-state");
  await expect(page).toHaveURL(/\/login\?oauth=invalid/);
});
