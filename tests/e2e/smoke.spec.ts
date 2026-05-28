import { expect, test } from "@playwright/test";

test("public pages and protected redirect load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /login/i })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
