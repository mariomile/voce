import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Evals call the real model through Vercel AI Gateway: they cost money and run only with `pnpm evals`,
// never with `pnpm test`. Gateway credentials come from .env.local (`vercel env pull`).
if (existsSync(".env.local")) process.loadEnvFile(".env.local")

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../src", import.meta.url)),
    },
  },
  test: {
    include: ["evals/**/*.eval.ts"],
    testTimeout: 300_000,
  },
})
