import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/test-results',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The Chrome already installed on the machine — no browser download.
    channel: 'chrome',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `nuxt build && nuxt preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    // Every /api call is stubbed in the tests; a dead base URL guarantees nothing reaches Cloudflare.
    env: { CF_API_BASE: 'http://127.0.0.1:9', CF_ACCOUNT_ID: 'e2e', CF_API_TOKEN: 'e2e' },
  },
})
