import { defineConfig, devices } from "@playwright/test"

// End-to-end test of the main flow against the local Supabase stack (`supabase start`).
// The app runs on port 3000 because the confirmation email links to site_url in supabase/config.toml.
// The analysis goes to a fake Anthropic API, never to a real model.

const FAKE_ANTHROPIC_PORT = 4010

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    // Voce follows the browser language: the suite runs as an Italian browser, like the product's
    // first users. e2e/english.spec.ts opens its own English contexts.
    locale: "it-IT",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/fake-anthropic.mts",
      url: `http://127.0.0.1:${FAKE_ANTHROPIC_PORT}/health`,
      env: { FAKE_ANTHROPIC_PORT: String(FAKE_ANTHROPIC_PORT) },
      reuseExistingServer: false,
    },
    {
      // CI builds first and serves the build; locally the dev server is enough.
      command: process.env.CI ? "pnpm start" : "pnpm dev",
      url: "http://localhost:3000/login",
      timeout: 120_000,
      // An already running app would call the real Anthropic API: always start a fresh one.
      reuseExistingServer: false,
      env: {
        ANTHROPIC_BASE_URL: `http://127.0.0.1:${FAKE_ANTHROPIC_PORT}/v1`,
        ANTHROPIC_API_KEY: "fake-anthropic-key",
        POSTHOG_KEY: "",
      },
    },
  ],
})
