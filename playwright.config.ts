import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 900_000,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    navigationTimeout: 120_000,
    actionTimeout: 30_000,
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm dev --port 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
