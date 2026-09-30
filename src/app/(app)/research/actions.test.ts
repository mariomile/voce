import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// createResearch writes for real, as a fresh test user.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
// redirect() ends the action: here it throws where it would send the browser.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect ${path}`)
  },
}))

const { createResearch, deleteResearch, updateResearchQuestion } = await import("./actions")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("research")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(() => {
  session.client = user.client
})

async function questions() {
  const { data } = await admin.from("research").select("question").eq("workspace_id", user.workspaceId).order("created_at")
  return data!.map((r) => r.question)
}

describe("createResearch", () => {
  it("empty, blank and 201-character questions return invalid or too_long and create nothing", async () => {
    expect(await createResearch("")).toEqual({ ok: false, reason: "invalid" })
    expect(await createResearch(" \n\t ")).toEqual({ ok: false, reason: "invalid" })
    expect(await createResearch("a".repeat(201))).toEqual({ ok: false, reason: "too_long" })
    // @ts-expect-error not a string on purpose
    expect(await createResearch(null)).toEqual({ ok: false, reason: "invalid" })
    expect(await questions()).toEqual(["Domanda di prova?"])
  })

  it("a valid question creates the Research and gives its id, where the browser goes", async () => {
    const question = `  ${"a".repeat(199)}?  `
    const result = await createResearch(question)
    const { data } = await admin
      .from("research")
      .select("id, question, form_enabled, form_question")
      .eq("workspace_id", user.workspaceId)
      .eq("question", `${"a".repeat(199)}?`)
      .single()
    expect(data).toMatchObject({ form_enabled: true, form_question: null })
    expect(result).toEqual({ ok: true, id: data!.id })
  })

  it("the form asks the Research question, trimmed, when it fits the form limit", async () => {
    const fits = "b".repeat(139) + "?"
    expect(await createResearch(`  ${fits} `)).toMatchObject({ ok: true })
    const { data } = await admin.from("research").select("form_question").eq("workspace_id", user.workspaceId).eq("question", fits).single()
    expect(data!.form_question).toBe(fits)
  })

  it("a question over the form limit keeps the default form question", async () => {
    const long = "c".repeat(140) + "?"
    expect(await createResearch(long)).toMatchObject({ ok: true })
    const { data } = await admin.from("research").select("form_question").eq("workspace_id", user.workspaceId).eq("question", long).single()
    expect(data!.form_question).toBeNull()
  })

  it("drops NUL characters instead of crashing", async () => {
    expect(await createResearch("Con\u0000 NUL?")).toMatchObject({ ok: true })
    expect(await questions()).toContain("Con NUL?")
  })

  it("without a session returns session and creates nothing", async () => {
    const { anon } = await import("@/test/supabase")
    session.client = anon()
    const before = await questions()
    expect(await createResearch("Senza sessione?")).toEqual({ ok: false, reason: "session" })
    expect(await questions()).toEqual(before)
  })
})

// A Research of the user with a theme, a hypothesis and its verdict, as an analysis leaves them.
async function researchWithSynthesis(question: string) {
  const created = await user.client.rpc("create_research", { ws: user.workspaceId, question })
  if (created.error) throw created.error
  const id: string = created.data
  const ws = user.workspaceId
  const { data: feedback } = await admin
    .from("feedback")
    .insert({ workspace_id: ws, research_id: id, text: "Il prezzo pesa.", channel: "Supporto" })
    .select("id")
    .single()
  const { data: analyses } = await admin
    .from("analyses")
    .insert([
      { workspace_id: ws, research_id: id, kind: "themes" as const, period_start: "2026-09-01", feedback_count: 1, status: "done" as const },
      { workspace_id: ws, research_id: id, kind: "verdict" as const, period_start: "2026-09-01", feedback_count: 1, status: "done" as const },
    ])
    .select("id, kind")
  const analysisOf = (kind: string) => analyses!.find((a) => a.kind === kind)!.id
  await admin.from("themes").insert({
    workspace_id: ws,
    research_id: id,
    analysis_id: analysisOf("themes"),
    kind: "problem",
    title: "Prezzo",
    summary: "Il prezzo pesa.",
    sentiment: "negative",
  })
  const { data: hypothesis } = await admin
    .from("research_hypotheses")
    .insert({ workspace_id: ws, research_id: id, text: "Il prezzo frena" })
    .select("id")
    .single()
  await admin.from("hypothesis_verdicts").insert({
    hypothesis_id: hypothesis!.id,
    workspace_id: ws,
    research_id: id,
    analysis_id: analysisOf("verdict"),
    verdict: "confirmed",
    reasoning: "Il prezzo pesa.",
    feedback_read: 1,
    arrived_after: 0,
  })
  await admin
    .from("verdict_feedback")
    .insert({ hypothesis_id: hypothesis!.id, feedback_id: feedback!.id, workspace_id: ws, stance: "for", quote_rank: 1, highlight: "prezzo" })
  return id
}

async function synthesisOf(id: string) {
  const [themes, hypotheses, verdicts] = await Promise.all([
    admin.from("themes").select("title").eq("research_id", id),
    admin.from("research_hypotheses").select("text, written_at").eq("research_id", id),
    admin.from("hypothesis_verdicts").select("verdict, verdict_feedback (highlight)").eq("research_id", id),
  ])
  return { themes: themes.data, hypotheses: hypotheses.data, verdicts: verdicts.data }
}

async function questionOf(id: string) {
  const { data } = await admin.from("research").select("question").eq("id", id).maybeSingle()
  return data?.question ?? null
}

describe("updateResearchQuestion", () => {
  it("updating the question keeps themes, hypotheses and verdicts", async () => {
    const id = await researchWithSynthesis("Prima della modifica?")
    const before = await synthesisOf(id)
    expect(before.verdicts).toHaveLength(1)
    expect(await updateResearchQuestion(id, "  Dopo la modifica?  ")).toEqual({ ok: true })
    expect(await questionOf(id)).toBe("Dopo la modifica?")
    expect(await synthesisOf(id)).toEqual(before)
  })

  it("empty, blank and 201-character questions return invalid or too_long and change nothing", async () => {
    expect(await updateResearchQuestion(user.researchId, "")).toEqual({ ok: false, reason: "invalid" })
    expect(await updateResearchQuestion(user.researchId, " \n ")).toEqual({ ok: false, reason: "invalid" })
    expect(await updateResearchQuestion(user.researchId, "a".repeat(201))).toEqual({ ok: false, reason: "too_long" })
    expect(await questionOf(user.researchId)).toBe("Domanda di prova?")
  })

  it("another workspace's Research or a wrong id is failed, and nothing changes", async () => {
    const other = await createTestUser("research-other")
    try {
      expect(await updateResearchQuestion(other.researchId, "Presa?")).toEqual({ ok: false, reason: "failed" })
      expect(await questionOf(other.researchId)).toBe("Domanda di prova?")
      expect(await updateResearchQuestion("non-un-uuid", "Presa?")).toEqual({ ok: false, reason: "failed" })
    } finally {
      await deleteTestUsers([other])
    }
  })

  it("without a session returns session and changes nothing", async () => {
    const { anon } = await import("@/test/supabase")
    session.client = anon()
    expect(await updateResearchQuestion(user.researchId, "Senza sessione?")).toEqual({ ok: false, reason: "session" })
    expect(await questionOf(user.researchId)).toBe("Domanda di prova?")
  })
})

describe("deleteResearch", () => {
  it("deletes the Research with its synthesis and sends the browser to /research", async () => {
    const id = await researchWithSynthesis("Da eliminare?")
    await expect(deleteResearch(id)).rejects.toThrow("redirect /research")
    expect(await questionOf(id)).toBeNull()
    expect(await synthesisOf(id)).toEqual({ themes: [], hypotheses: [], verdicts: [] })
    // The analyses stay, without their Research: they still count in the month.
    const { data: analyses } = await admin.from("analyses").select("research_id").eq("workspace_id", user.workspaceId).is("research_id", null)
    expect(analyses!.length).toBeGreaterThanOrEqual(2)
  })

  it("deleteResearch returns failed for another workspace's Research or a wrong id, and deletes nothing", async () => {
    const other = await createTestUser("research-other")
    try {
      expect(await deleteResearch(other.researchId)).toEqual({ ok: false, reason: "failed" })
      expect(await questionOf(other.researchId)).toBe("Domanda di prova?")
      expect(await deleteResearch("non-un-uuid")).toEqual({ ok: false, reason: "failed" })
    } finally {
      await deleteTestUsers([other])
    }
  })

  it("deleteResearch without a session returns session and deletes nothing", async () => {
    const { anon } = await import("@/test/supabase")
    session.client = anon()
    expect(await deleteResearch(user.researchId)).toEqual({ ok: false, reason: "session" })
    expect(await questionOf(user.researchId)).toBe("Domanda di prova?")
  })
})
