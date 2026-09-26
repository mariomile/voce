import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// Rules that live in files rather than in behavior: read the files and check them.

const migrations = readdirSync("supabase/migrations")

describe("the questions migration", () => {
  it("enables RLS on questions and question_runs in the same file that creates them", () => {
    const creating = migrations.filter((f) =>
      /create table public\.questions\b/.test(readFileSync(`supabase/migrations/${f}`, "utf8"))
    )
    expect(creating).toHaveLength(1)
    const sql = readFileSync(`supabase/migrations/${creating[0]}`, "utf8")
    expect(sql).toMatch(/create table public\.question_runs\b/)
    expect(sql).toMatch(/alter table public\.questions enable row level security;/)
    expect(sql).toMatch(/alter table public\.question_runs enable row level security;/)
  })
})
