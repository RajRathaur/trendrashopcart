import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Trendra E2E smoke tests.
 *
 * Target the deployed staging/production URL via SMOKE_BASE_URL
 * (defaults to the published Lovable domain).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "https://trendra.store",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
