import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Local Supabase URL and keys for the tests.
if (existsSync(".env.local")) process.loadEnvFile(".env.local")

export default defineConfig({
  // Tests never send analytics, even with a PostHog key in .env.local.
  test: { env: { POSTHOG_KEY: "" }, exclude: ["**/node_modules/**", "e2e/**"] },
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // server-only throws outside React Server Components; tests run in plain Node.
      { find: "server-only", replacement: fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)) },
      // next-intl reads the language from the Next request: tests have none and render in Italian.
      { find: /^next-intl$/, replacement: fileURLToPath(new URL("./src/test/next-intl.tsx", import.meta.url)) },
      { find: /^next-intl\/server$/, replacement: fileURLToPath(new URL("./src/test/next-intl-server.ts", import.meta.url)) },
    ],
  },
})
