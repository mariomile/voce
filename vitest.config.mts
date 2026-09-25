import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Local Supabase URL and keys for the tests.
if (existsSync(".env.local")) process.loadEnvFile(".env.local")

export default defineConfig({
  // Tests never send analytics, even with a PostHog key in .env.local.
  test: { env: { POSTHOG_KEY: "" } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // server-only throws outside React Server Components; tests run in plain Node.
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
})
