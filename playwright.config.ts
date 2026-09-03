import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:8790',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'VITE_DEV_AUTO_LOGIN=true pnpm run-local --port 8790',
    url: 'http://localhost:8790',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
