import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config.
 * - Boots the Next dev server if it isn't already running.
 * - Tests live under e2e/ so they don't get picked up by vitest.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false, // dev server is single-threaded; parallel = flaky
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "yarn dev",
    url: "http://localhost:3000/calculator",
    timeout: 120_000,
    reuseExistingServer: true
  }
});
