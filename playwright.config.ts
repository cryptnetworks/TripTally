import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const databaseUrl = process.env.DATABASE_URL ?? `file:${path.resolve("prisma/playwright.db")}`;

process.env.DATABASE_URL ??= databaseUrl;
process.env.NEXTAUTH_URL ??= baseURL;
process.env.PUBLIC_APP_URL ??= baseURL;
process.env.NEXTAUTH_SECRET ??= "playwright-nextauth-secret-for-tests";
process.env.TOKEN_DIGEST_SECRET ??= "playwright-token-digest-secret";
process.env.AUTH_CONFIG_ENCRYPTION_KEY ??= "playwright-auth-config-key-for-tests";
process.env.SMTP_ENABLED ??= "false";
process.env.TEST_OAUTH_PROVIDER_ENABLED ??= "true";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "npm run prisma:generate && node scripts/reset-playwright-db.mjs && npm run dev -- -H 127.0.0.1 -p 3000",
        env: {
          DATABASE_URL: databaseUrl,
          NEXTAUTH_URL: baseURL,
          PUBLIC_APP_URL: baseURL,
          NEXTAUTH_SECRET: "playwright-nextauth-secret-for-tests",
          TOKEN_DIGEST_SECRET: "playwright-token-digest-secret",
          AUTH_CONFIG_ENCRYPTION_KEY: "playwright-auth-config-key-for-tests",
          SMTP_ENABLED: "false",
          TEST_OAUTH_PROVIDER_ENABLED: "true"
        },
        url: `${baseURL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      },
  projects: [
    {
      name: "Chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "Firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "WebKit",
      use: { ...devices["Desktop Safari"] }
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 740 }
      }
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 13"]
      }
    }
  ]
});
