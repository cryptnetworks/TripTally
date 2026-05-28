import { expect, test } from "@playwright/test";
import { configureTestAuthSettings, registerAndLogin } from "./helpers";

test.beforeAll(() => {
  configureTestAuthSettings();
});

test("item lookup disabled state returns empty results without exposing provider keys", async ({
  page
}, testInfo) => {
  await registerAndLogin(page, testInfo, "lookup");

  const response = await page.request.get("/api/item-lookup/search?q=coffee");
  expect(response.ok()).toBe(true);
  expect(response.headers()["x-api-key"]).toBeUndefined();
  expect(response.headers().authorization).toBeUndefined();
  expect(await response.json()).toEqual({ results: [] });
});
