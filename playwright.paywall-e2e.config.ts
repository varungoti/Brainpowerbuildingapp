import { defineConfig, devices } from "@playwright/test";

/**
 * Isolated E2E: production-like paywall with fake Supabase URL + Playwright network mocks.
 * Build uses `.env.e2e-paywall` via `vite build --mode e2e-paywall`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /paywall-checkout\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4174",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm exec vite build --mode e2e-paywall && pnpm exec vite preview --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
