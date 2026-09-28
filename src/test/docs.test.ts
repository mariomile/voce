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

describe("the research migration", () => {
  it("enables RLS on research in the same file that creates it", () => {
    const creating = migrations.filter((f) =>
      /create table public\.research\b/.test(readFileSync(`supabase/migrations/${f}`, "utf8"))
    )
    expect(creating).toEqual(["20261001090000_research.sql"])
    const sql = readFileSync(`supabase/migrations/${creating[0]}`, "utf8")
    expect(sql).toMatch(/alter table public\.research enable row level security;/)
  })
})

describe("the Research page", () => {
  it("the Research page exports maxDuration 300: the analysis runs from it", () => {
    const page = readFileSync("src/app/(app)/research/[id]/page.tsx", "utf8")
    expect(page).toMatch(/^export const maxDuration = 300$/m)
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
  it("lists the question text that goes to the Anthropic API", () => {
    const doc = readFileSync("docs/prima-dei-clienti-reali.md", "utf8")
    expect(doc).toMatch(/\*\*Testo delle domande[^\n]*API Anthropic/)
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

describe("the ask files", () => {
  it("never use dangerouslySetInnerHTML", () => {
    const files = [
      ...readdirSync("src/app/(app)/ask").map((f) => `src/app/(app)/ask/${f}`),
      ...readdirSync("src/components").filter((f) => f.startsWith("ask-")).map((f) => `src/components/${f}`),
    ]
    expect(files.length).toBeGreaterThanOrEqual(6)
    for (const file of files) expect(readFileSync(file, "utf8"), file).not.toContain("dangerouslySetInnerHTML")
  })
})
