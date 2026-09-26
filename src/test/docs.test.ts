import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { PLAN_LIMITS } from "@/lib/plans"

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

describe("the question quota", () => {
  it("PLAN_LIMITS mirrors private.questions_limit", () => {
    const sql = readFileSync("supabase/migrations/20260927120000_questions.sql", "utf8")
    const limit = sql.match(/create function private\.questions_limit[\s\S]*?then (\d+)\s+else (\d+)/)!
    expect([Number(limit[1]), Number(limit[2])]).toEqual([PLAN_LIMITS.pro.questionsPerMonth, PLAN_LIMITS.free.questionsPerMonth])
  })
})

describe("prima-dei-clienti-reali", () => {
  it("lists the question text that goes through the Vercel AI Gateway", () => {
    const doc = readFileSync("docs/prima-dei-clienti-reali.md", "utf8")
    expect(doc).toMatch(/\*\*Testo delle domande[^\n]*Vercel AI Gateway/)
  })
})

describe("analytics.md", () => {
  it("documents question_answered, its properties, when it is sent, and that it skips analytics_milestones", () => {
    const doc = readFileSync("docs/analytics.md", "utf8")
    const row = doc.split("\n").find((line) => line.startsWith("| `question_answered`"))
    expect(row).toBeDefined()
    expect(row).toContain("`citation_count`")
    expect(row).toContain("`outcome`")
    expect(row).toMatch(/ogni domanda/i)
    expect(doc).toMatch(/`question_answered`[^\n]*non passa da `analytics_milestones`/)
  })
})
