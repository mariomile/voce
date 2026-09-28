import { MockLanguageModelV4 } from "ai/test"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { RawOutput } from "@/lib/analysis"
import { isoDateOf } from "@/lib/format"
import { fakeModel, fakeSynthesisModel } from "@/test/fake-model"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The synthesis of a Research runs for real against the local database, as a fresh test user.
// The model is always fake: no call leaves the machine. In this part only the themes run.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
// Which activation events the action asks for. Sending them is tested in src/lib/analytics.test.ts.
const analytics = vi.hoisted(() => ({ trackMilestone: vi.fn(), trackEvent: vi.fn() }))
vi.mock("@/lib/analytics", () => analytics)
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))
// The options each model call gets, to check the timeout: the fake model does not see it.
const calls = vi.hoisted(() => ({ options: [] as Record<string, unknown>[] }))
vi.mock("ai", async (importOriginal) => {
  const original = await importOriginal<typeof import("ai")>()
  return {
    ...original,
    generateText: ((options: Record<string, unknown>) => {
      calls.options.push(options)
      return original.generateText(options as never)
    }) as typeof original.generateText,
  }
})

// The language of the interface when the analysis starts. Italian unless a test says otherwise.
const ui = vi.hoisted(() => ({ locale: "it" }))
vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getLocale: async () => ui.locale,
}))

const { synthesize } = await import("./actions")
const { analysisInstructions } = await import("@/lib/analysis")
const { verdictInstructions } = await import("@/lib/verdict")
const { deleteFeedback } = await import("@/app/(app)/research/[id]/feedback/actions")
const { getDashboard, getUsage, listHypotheses } = await import("@/lib/data")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("analysis")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  session.client = user.client
  ui.locale = "it"
  calls.options = []
  // Hypotheses first: their verdicts point to the analyses.
  await admin.from("research_hypotheses").delete().eq("workspace_id", user.workspaceId)
  await admin.from("analyses").delete().eq("workspace_id", user.workspaceId)
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
})

const TEXTS = [
  "La banca si scollega ogni lunedì.",
  "Devo ricollegare la banca ogni settimana, che fatica.",
  "Adoro l'invio delle fatture dal telefono.",
  "Mandare le fatture dal telefono è velocissimo.",
  "Il commercialista vorrebbe un accesso suo.",
]

const research = () => ({ id: user.researchId, workspaceId: user.workspaceId })

const daysAgo = (days: number) => isoDateOf(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

// One feedback per day, newest first: the model sees text i as number i + 1.
async function addFeedback(texts = TEXTS, firstDaysAgo = 0) {
  const rows = texts.map((text, i) => ({
    workspace_id: user.workspaceId,
    research_id: user.researchId,
    text,
    channel: "Supporto",
    received_at: daysAgo(firstDaysAgo + i),
  }))
  const { data, error } = await admin.from("feedback").insert(rows).select("id, text")
  if (error) throw error
  return texts.map((t) => data.find((d) => d.text === t)!.id)
}

const bank = {
  title: "La banca si scollega",
  summary: "Il collegamento con la banca cade spesso.",
  kind: "problem",
  sentiment: "negative",
  feedback: [1, 2],
  quotes: [
    { feedback: 1, text: "si scollega ogni lunedì" },
    { feedback: 2, text: "ricollegare la banca ogni settimana" },
  ],
} satisfies RawOutput["themes"][number]

const phone = {
  title: "Fatture dal telefono veloci",
  summary: "Inviare le fatture da mobile piace.",
  kind: "praise",
  sentiment: "positive",
  feedback: [3, 4],
  quotes: [{ feedback: 4, text: "velocissimo" }],
} satisfies RawOutput["themes"][number]

function answer(output: RawOutput | string) {
  const model = fakeModel(output, { input: 100_000, output: 10_000 })
  ai.model = model
  return model
}

function failingModel(error: Error) {
  const model = new MockLanguageModelV4({
    doGenerate: async () => {
      throw error
    },
  })
  ai.model = model
  return model
}

async function analyses() {
  const { data } = await admin
    .from("analyses")
    .select("id, status, feedback_count, period_start, research_id, kind")
    .eq("workspace_id", user.workspaceId)
    .order("created_at")
  return data!
}

async function runLog(analysisId: string) {
  const { data } = await admin.from("analysis_runs").select("*").eq("analysis_id", analysisId).single()
  return data!
}

async function themesOf(analysisId: string) {
  const { data } = await admin
    .from("themes")
    .select("title, summary, kind, sentiment, priority, status, theme_feedback (feedback_id, quote_rank, highlight)")
    .eq("analysis_id", analysisId)
    .order("title")
  return data!
}

async function insertAnalyses(count: number, status: "done" | "failed" | "running", createdAt = new Date()) {
  const rows = Array.from({ length: count }, () => ({
    workspace_id: user.workspaceId,
    research_id: user.researchId,
    period_start: daysAgo(30),
    feedback_count: 1,
    status,
    created_at: createdAt.toISOString(),
  }))
  const { error } = await admin.from("analyses").insert(rows)
  if (error) throw error
}

describe("synthesize", () => {
  it("saves themes, links, quotes, sentiment and the run log", async () => {
    const ids = await addFeedback()
    const model = answer({ themes: [bank, phone] })

    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })

    const [analysis] = await analyses()
    expect(analysis).toMatchObject({ status: "done", feedback_count: 5, period_start: daysAgo(4), research_id: user.researchId, kind: "themes" })
    const themes = await themesOf(analysis.id)
    expect(themes.map((t) => ({ ...t, theme_feedback: undefined }))).toEqual([
      { ...themeRow(phone), theme_feedback: undefined },
      { ...themeRow(bank), theme_feedback: undefined },
    ])
    const bankLinks = themes[1].theme_feedback.sort((a, b) => (a.quote_rank ?? 9) - (b.quote_rank ?? 9))
    expect(bankLinks).toEqual([
      { feedback_id: ids[0], quote_rank: 1, highlight: "si scollega ogni lunedì" },
      { feedback_id: ids[1], quote_rank: 2, highlight: "ricollegare la banca ogni settimana" },
    ])

    const log = await runLog(analysis.id)
    expect(log).toMatchObject({
      workspace_id: user.workspaceId,
      model: "claude-sonnet-5",
      input_tokens: 100_000,
      output_tokens: 10_000,
      cost_usd: 0.3,
      error: null,
      output: { themes: [bank, phone] },
      issues: [],
    })
    expect(log.duration_ms).toBeGreaterThanOrEqual(0)
    expect(log.finished_at).not.toBeNull()
    const input = log.input as { instructions: string; prompt: string; feedback_ids: string[] }
    expect(input.feedback_ids).toEqual(ids)
    expect(input.prompt).toContain("Il commercialista vorrebbe un accesso suo.")
    expect(input.instructions).not.toContain("commercialista")
    expect(model.doGenerateCalls).toHaveLength(1)

    // The dashboard shows the new themes, largest first.
    const dashboard = await getDashboard(research(), { status: "all" })
    expect(dashboard.analysis?.id).toBe(analysis.id)
    expect(dashboard.themes.map((t) => [t.title, t.sentiment, t.feedbackCount])).toEqual([
      ["La banca si scollega", "negative", 2],
      ["Fatture dal telefono veloci", "positive", 2],
    ])
  })

  it("asks for titles and summaries in the language of the interface", async () => {
    await addFeedback()
    ui.locale = "en"
    const model = answer({ themes: [] })
    await synthesize(user.researchId)
    const system = model.doGenerateCalls[0].prompt.filter((m) => m.role === "system")
    expect(system).toEqual([{ role: "system", content: analysisInstructions("en") }])
    const [analysis] = await analyses()
    expect((await runLog(analysis.id)).input).toMatchObject({ instructions: analysisInstructions("en") })
  })

  it("carries priority and status to the themes with the same title", async () => {
    await addFeedback()
    answer({ themes: [bank, phone] })
    await synthesize(user.researchId)
    const [first] = await analyses()
    await user.client.from("themes").update({ priority: "high", status: "roadmap" }).eq("analysis_id", first.id).eq("title", bank.title)
    await user.client.from("themes").update({ status: "discarded" }).eq("analysis_id", first.id).eq("title", phone.title)

    // The model saw the existing titles and reused one, with different case and spaces.
    const model = answer({ themes: [{ ...bank, title: "  la banca SI scollega " }, { ...phone, title: "Un tema nuovo" }] })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain("Fatture dal telefono veloci")

    const [, second] = await analyses()
    const themes = await themesOf(second.id)
    expect(themes.map((t) => [t.title, t.priority, t.status])).toEqual([
      ["la banca SI scollega", "high", "roadmap"],
      ["Un tema nuovo", null, "to_review"],
    ])
    // The first analysis keeps its themes as they were.
    expect((await themesOf(first.id)).map((t) => [t.title, t.priority, t.status])).toEqual([
      ["Fatture dal telefono veloci", null, "discarded"],
      ["La banca si scollega", "high", "roadmap"],
    ])
  })

  it("drops what does not hold up and logs why", async () => {
    const ids = await addFeedback()
    answer({
      themes: [
        { ...bank, feedback: [1, 2, 99], quotes: [{ feedback: 1, text: "si scollega ogni martedì" }, { feedback: 5, text: "commercialista" }, bank.quotes[1]] },
        { ...phone, feedback: [3] },
      ],
    })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })
    const [analysis] = await analyses()
    const themes = await themesOf(analysis.id)
    expect(themes).toHaveLength(1)
    const links = themes[0].theme_feedback.sort((a, b) => (a.quote_rank ?? 9) - (b.quote_rank ?? 9))
    expect(links.map((l) => [l.feedback_id, l.quote_rank, l.highlight])).toEqual([
      [ids[1], 1, "ricollegare la banca ogni settimana"],
      [ids[0], null, null],
    ])
    expect((await runLog(analysis.id)).issues).toEqual([
      { theme: bank.title, problem: "unknown_feedback", detail: 99 },
      { theme: bank.title, problem: "quote_not_in_feedback", detail: 1 },
      { theme: bank.title, problem: "quote_not_linked", detail: 5 },
      { theme: phone.title, problem: "too_few_feedback", detail: 1 },
    ])
  })

  it("keeps the previous themes and the quota when the model fails or times out", async () => {
    await addFeedback()
    answer({ themes: [bank] })
    await synthesize(user.researchId)
    const [done] = await analyses()

    for (const error of [new Error("Anthropic API down"), new DOMException("The operation timed out.", "TimeoutError")]) {
      failingModel(error)
      expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "failed" })
    }

    const all = await analyses()
    expect(all.map((a) => a.status)).toEqual(["done", "failed", "failed"])
    expect((await runLog(all[1].id)).error).toContain("Anthropic API down")
    expect((await runLog(all[2].id)).error).toContain("TimeoutError")
    expect((await runLog(all[2].id)).finished_at).not.toBeNull()
    const dashboard = await getDashboard(research(), { status: "all" })
    expect(dashboard.analysis?.id).toBe(done.id)
    expect(dashboard.themes.map((t) => t.title)).toEqual([bank.title])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(1)
  })

  it("saves the raw text when the model answers in the wrong shape", async () => {
    await addFeedback()
    answer("Ecco i temi: banca e fatture")
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "failed" })
    const [failed] = await analyses()
    expect(failed.status).toBe("failed")
    const log = await runLog(failed.id)
    expect(log).toMatchObject({ output: "Ecco i temi: banca e fatture", input_tokens: 100_000, cost_usd: 0.3 })
    expect(log.error).toContain("NoObjectGeneratedError")
    expect(await themesOf(failed.id)).toEqual([])
  })

  it("Free: 3 analyses a month, failed ones do not count", async () => {
    await addFeedback()
    await insertAnalyses(2, "done")
    await insertAnalyses(2, "failed")
    await insertAnalyses(3, "done", new Date(Date.now() - 40 * 24 * 60 * 60 * 1000))
    answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })

    const model = answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(3)
  })

  it("failed runs cost tokens: at most as many as the quota each month", async () => {
    await addFeedback()
    await insertAnalyses(3, "failed")
    const model = answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(0)
  })

  it("an analysis with no theme left is failed: the previous one stays, the quota too", async () => {
    await addFeedback()
    answer({ themes: [bank] })
    await synthesize(user.researchId)
    const [done] = await analyses()

    for (const output of [{ themes: [] }, { themes: [{ ...phone, feedback: [3] }] }]) {
      answer(output)
      expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "no_themes" })
    }
    const all = await analyses()
    expect(all.map((a) => a.status)).toEqual(["done", "failed", "failed"])
    expect(await runLog(all[2].id)).toMatchObject({
      error: "no_themes",
      issues: [{ theme: phone.title, problem: "too_few_feedback", detail: 1 }],
      input_tokens: 100_000,
    })
    expect((await getDashboard(research(), { status: "all" })).analysis?.id).toBe(done.id)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(1)
  })

  it("Pro: 100 analyses a month, also after going back to Free only 3", async () => {
    await addFeedback()
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    await insertAnalyses(99, "done")
    answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "limit" })

    await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "limit" })
  })

  it("runs one analysis at a time, and frees a stuck one after 10 minutes", async () => {
    await addFeedback()
    await insertAnalyses(1, "running", new Date(Date.now() - 2 * 60 * 1000))
    const model = answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "busy" })
    expect(model.doGenerateCalls).toHaveLength(0)

    await admin.from("analyses").delete().eq("workspace_id", user.workspaceId)
    await insertAnalyses(1, "running", new Date(Date.now() - 11 * 60 * 1000))
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })
    expect((await analyses()).map((a) => a.status)).toEqual(["failed", "done"])
  })

  it("asks for the first analysis event with counts only, and not when the analysis fails", async () => {
    await addFeedback()
    analytics.trackMilestone.mockClear()
    answer("non è JSON")
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "failed" })
    expect(analytics.trackMilestone).not.toHaveBeenCalled()
    answer({ themes: [bank, phone] })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: expect.any(Number) })
    expect(analytics.trackMilestone).toHaveBeenCalledExactlyOnceWith(user.workspaceId, {
      event: "first_analysis_completed",
      properties: { feedback_count: 5, theme_count: 2 },
    })
  })

  it("two clicks at once make one analysis", async () => {
    await addFeedback()
    // The model holds its answer until the other click is refused: otherwise a fast first
    // analysis could finish before the second click starts, and both would pass.
    const model = answer({ themes: [bank] })
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    ai.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        await held
        return model.doGenerate(options)
      },
    })
    const clicks = [synthesize(user.researchId), synthesize(user.researchId)]
    expect(await Promise.race(clicks)).toEqual({ ok: false, reason: "busy" })
    release()
    const results = await Promise.all(clicks)
    expect(results).toContainEqual(expect.objectContaining({ ok: true, themeCount: 1 }))
    expect(results).toContainEqual({ ok: false, reason: "busy" })
    expect((await analyses()).map((a) => a.status)).toEqual(["done"])
  })

  it("a feedback deleted while the analysis runs is left out, and the analysis still finishes", async () => {
    const ids = await addFeedback()
    // The model holds its answer until the feedback is deleted: it still names it in a theme and a quote.
    const model = answer({ themes: [bank, phone] })
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    let called = () => {}
    const modelCalled = new Promise<void>((resolve) => (called = resolve))
    ai.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        called()
        await held
        return model.doGenerate(options)
      },
    })
    const running = synthesize(user.researchId)
    await modelCalled
    expect(await deleteFeedback(ids[0])).toEqual({ ok: true })
    release()
    expect(await running).toMatchObject({ ok: true, themeCount: expect.any(Number) })

    const [analysis] = await analyses()
    expect(analysis.status).toBe("done")
    const themes = await themesOf(analysis.id)
    expect(themes.map((t) => [t.title, t.theme_feedback.map((l) => [l.feedback_id, l.quote_rank, l.highlight])])).toEqual([
      [phone.title, expect.arrayContaining([[ids[2], null, null], [ids[3], 1, "velocissimo"]])],
      [bank.title, [[ids[1], 2, "ricollegare la banca ogni settimana"]]],
    ])
    const dashboard = await getDashboard(research(), { status: "all" })
    expect(dashboard.themes.map((t) => [t.title, t.feedbackCount])).toEqual([
      [phone.title, 2],
      [bank.title, 1],
    ])
  })

  it("a Research without feedback is no_feedback and makes no call", async () => {
    const model = answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "no_feedback" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await analyses()).toEqual([])
  })

  it("sends the 500 most recent feedback of the Research, with no 90-day window", async () => {
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const rows = Array.from({ length: 500 }, (_, i) => ({
      workspace_id: user.workspaceId,
      research_id: user.researchId,
      text: `Feedback ${i}`,
      channel: "Supporto",
      received_at: daysAgo(100 + Math.floor(i / 10)),
    }))
    await admin.from("feedback").insert(rows)
    await addFeedback(["Il più vecchio"], 400)
    const model = answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themeCount: 1 })

    const [analysis] = await analyses()
    expect(analysis).toMatchObject({ feedback_count: 500, period_start: daysAgo(149), research_id: user.researchId, kind: "themes" })
    const input = (await runLog(analysis.id)).input as { feedback_ids: string[]; prompt: string }
    expect(input.feedback_ids).toHaveLength(500)
    expect(input.prompt).toContain("Feedback 0")
    expect(input.prompt).not.toContain("Il più vecchio")
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain('\\"n\\":500')
  })

  it("stops at 1,000,000 characters: 250 notes of 4,000 of 300", async () => {
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const rows = Array.from({ length: 300 }, (_, i) => ({
      workspace_id: user.workspaceId,
      research_id: user.researchId,
      text: `${String(i).padStart(3, "0")}${"a".repeat(3997)}`,
      channel: "Intervista",
      received_at: daysAgo(i),
    }))
    await admin.from("feedback").insert(rows)
    answer({ themes: [bank] })
    await synthesize(user.researchId)
    const [analysis] = await analyses()
    expect(analysis.feedback_count).toBe(250)
    const input = (await runLog(analysis.id)).input as { feedback_ids: string[]; prompt: string }
    expect(input.feedback_ids).toHaveLength(250)
    expect(input.prompt).toContain("249aaa")
    expect(input.prompt).not.toContain("250aaa")
  })

  it("the prompt holds no feedback of another Research", async () => {
    await addFeedback()
    const other = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Altra?" })
    try {
      await admin.from("feedback").insert({ workspace_id: user.workspaceId, research_id: other.data!, text: "Di un'altra Research.", channel: "Supporto" })
      const model = answer({ themes: [bank] })
      await synthesize(user.researchId)
      expect(JSON.stringify(model.doGenerateCalls[0].prompt)).not.toContain("Di un'altra Research.")
      const [analysis] = await analyses()
      expect(((await runLog(analysis.id)).input as { feedback_ids: string[] }).feedback_ids).toHaveLength(5)
    } finally {
      await admin.from("research").delete().eq("id", other.data!)
    }
  })

  it("existing titles come from the last done themes analysis of the same Research", async () => {
    await addFeedback()
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const other = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Altra?" })
    try {
      await admin.from("feedback").insert([
        { workspace_id: user.workspaceId, research_id: other.data!, text: "Uno altrove.", channel: "Supporto" },
        { workspace_id: user.workspaceId, research_id: other.data!, text: "Due altrove.", channel: "Supporto" },
      ])
      answer({ themes: [bank] })
      await synthesize(user.researchId)
      // A later analysis of the other Research, with its own titles.
      answer({ themes: [{ ...phone, title: "Tema dell'altra Research", feedback: [1, 2], quotes: [] }] })
      expect(await synthesize(other.data!)).toMatchObject({ ok: true, themeCount: 1 })

      const model = answer({ themes: [bank] })
      await synthesize(user.researchId)
      const prompt = JSON.stringify(model.doGenerateCalls[0].prompt)
      expect(prompt).toContain(bank.title)
      expect(prompt).not.toContain("Tema dell'altra Research")
    } finally {
      await admin.from("research").delete().eq("id", other.data!)
    }
  })

  it("busy with an analysis running in another Research: no model call", async () => {
    await addFeedback()
    const other = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Altra?" })
    try {
      await admin.from("analyses").insert({
        workspace_id: user.workspaceId,
        research_id: other.data!,
        period_start: daysAgo(1),
        feedback_count: 1,
        status: "running",
      })
      const model = answer({ themes: [bank] })
      expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "busy" })
      expect(model.doGenerateCalls).toHaveLength(0)
    } finally {
      await admin.from("research").delete().eq("id", other.data!)
    }
  })

  it("the themes call has a 240,000 ms timeout and 16,000 output tokens", async () => {
    await addFeedback()
    answer({ themes: [bank] })
    await synthesize(user.researchId)
    expect(calls.options).toHaveLength(1)
    expect(calls.options[0]).toMatchObject({ timeout: 240_000, maxOutputTokens: 16_000 })
  })

  it("another workspace's Research is not_found, a wrong id too, and no call is made", async () => {
    const other = await createTestUser("synthesize-other")
    try {
      await admin.from("feedback").insert({ workspace_id: other.workspaceId, research_id: other.researchId, text: "Altrui", channel: "Supporto" })
      const model = answer({ themes: [bank] })
      expect(await synthesize(other.researchId)).toEqual({ ok: false, reason: "not_found" })
      expect(await synthesize("non-un-uuid")).toEqual({ ok: false, reason: "not_found" })
      expect(model.doGenerateCalls).toHaveLength(0)
      const { count } = await admin.from("analyses").select("id", { count: "exact", head: true }).eq("workspace_id", other.workspaceId)
      expect(count).toBe(0)
    } finally {
      await deleteTestUsers([other])
    }
  })

  it("without a session returns session and makes no call", async () => {
    await addFeedback()
    session.client = anon()
    const model = answer({ themes: [bank] })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "session" })
    expect(model.doGenerateCalls).toHaveLength(0)
  })
})

// ===== The verdict: a second call when the Research has hypotheses =====

const MARKER = "ZZMARCATOREZZ"

async function addHypotheses(texts: string[], writtenAt?: string) {
  const ids: string[] = []
  for (const text of texts) {
    const { data, error } = await admin
      .from("research_hypotheses")
      .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text })
      .select("id")
      .single()
    if (error) throw error
    ids.push(data.id)
  }
  if (writtenAt) await admin.from("research_hypotheses").update({ written_at: writtenAt }).in("id", ids)
  return ids
}

// Hypothesis 1 confirmed by feedback 1 and 2, against feedback 3; hypothesis 2 without evidence.
const priced = {
  hypotheses: [
    {
      hypothesis: 1,
      verdict: "confirmed",
      reasoning: "La banca si scollega spesso.",
      supporting: [1, 2],
      contradicting: [3],
      quotes: [
        { feedback: 2, stance: "for", text: "ricollegare la banca" },
        { feedback: 1, stance: "for", text: "si scollega" },
        { feedback: 3, stance: "against", text: "Adoro" },
      ],
    },
    { hypothesis: 2, verdict: "to_review", reasoning: "Nessuno ne parla.", supporting: [], contradicting: [], quotes: [] },
  ],
}

async function verdictsOf(hypothesisIds: string[]) {
  const { data } = await admin
    .from("hypothesis_verdicts")
    .select("hypothesis_id, analysis_id, verdict, reasoning, feedback_read, arrived_after, verdict_feedback (feedback_id, stance, quote_rank, highlight)")
    .in("hypothesis_id", hypothesisIds)
  return hypothesisIds.map((id) => data!.find((v) => v.hypothesis_id === id))
}

async function byKind() {
  const all = await analyses()
  return { themes: all.filter((a) => a.kind === "themes"), verdict: all.filter((a) => a.kind === "verdict") }
}

describe("synthesize with hypotheses", () => {
  it("with hypotheses one click reserves themes and verdict together and calls the model twice", async () => {
    const ids = await addFeedback()
    const hypotheses = await addHypotheses(["La banca si scollega", "Vogliono WhatsApp"])
    const model = fakeSynthesisModel({ themes: [bank, phone] }, priced)
    ai.model = model

    expect(await synthesize(user.researchId)).toEqual({
      ok: true,
      themes: "done",
      themeCount: 2,
      verdict: "done",
      verdicts: { confirmed: 1, refuted: 0, toReview: 1 },
      previousThemesDate: null,
    })
    expect(model.doGenerateCalls).toHaveLength(2)

    const { data: rows } = await admin.from("analyses").select("kind, status, created_at, feedback_count, research_id").eq("workspace_id", user.workspaceId)
    expect(rows!.map((r) => [r.kind, r.status, r.feedback_count, r.research_id]).sort()).toEqual([
      ["themes", "done", 5, user.researchId],
      ["verdict", "done", 5, user.researchId],
    ])
    // Reserved in the same transaction.
    expect(rows![0].created_at).toBe(rows![1].created_at)

    const { verdict } = await byKind()
    const [first, second] = await verdictsOf(hypotheses)
    expect(first).toMatchObject({ analysis_id: verdict[0].id, verdict: "confirmed", reasoning: "La banca si scollega spesso.", feedback_read: 5, arrived_after: 0 })
    expect(first!.verdict_feedback.sort((a, b) => a.stance.localeCompare(b.stance) || (a.quote_rank ?? 9) - (b.quote_rank ?? 9))).toEqual([
      { feedback_id: ids[2], stance: "against", quote_rank: 1, highlight: "Adoro" },
      { feedback_id: ids[1], stance: "for", quote_rank: 1, highlight: "ricollegare la banca" },
      { feedback_id: ids[0], stance: "for", quote_rank: 2, highlight: "si scollega" },
    ])
    expect(second).toMatchObject({ verdict: "to_review", verdict_feedback: [] })
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(2)
  })

  it("without hypotheses one themes row and one call", async () => {
    await addFeedback()
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themes: "done", verdict: "skipped", verdicts: { confirmed: 0, refuted: 0, toReview: 0 } })
    expect(model.doGenerateCalls).toHaveLength(1)
    expect((await analyses()).map((a) => a.kind)).toEqual(["themes"])
  })

  it("counts the feedback that entered Voce after each hypothesis was written", async () => {
    const ids = await addFeedback()
    const [older] = await addHypotheses(["La banca si scollega"], "2020-01-01T00:00:00Z")
    // Two feedback entered Voce after the second hypothesis: created_at, not the date of the feedback.
    await admin.from("feedback").update({ created_at: "2020-01-01T00:00:00Z" }).in("id", ids.slice(0, 3))
    const [newer] = await addHypotheses(["Vogliono WhatsApp"])
    await admin.from("feedback").update({ created_at: new Date(Date.now() + 60_000).toISOString() }).in("id", ids.slice(3))
    ai.model = fakeSynthesisModel({ themes: [bank] }, priced)
    await synthesize(user.researchId)
    const [a, b] = await verdictsOf([older, newer])
    expect([a!.feedback_read, a!.arrived_after]).toEqual([5, 2])
    expect([b!.feedback_read, b!.arrived_after]).toEqual([5, 2])
  })

  it("a hypothesis written after 29 of 37 feedback reads 8 arrived after", async () => {
    const texts = Array.from({ length: 37 }, (_, i) => `Feedback numero ${i + 1}.`)
    const ids = await addFeedback(texts)
    const writtenAt = new Date(Date.now() - 60 * 60 * 1000)
    const [hypothesis] = await addHypotheses(["La banca si scollega"], writtenAt.toISOString())
    const at = (ms: number) => new Date(writtenAt.getTime() + ms).toISOString()
    await admin.from("feedback").update({ created_at: at(-60 * 60 * 1000) }).in("id", ids.slice(0, 29))
    await admin.from("feedback").update({ created_at: at(60 * 1000) }).in("id", ids.slice(29))
    ai.model = fakeSynthesisModel(
      { themes: [bank] },
      {
        hypotheses: [
          { hypothesis: 1, verdict: "confirmed", reasoning: "Ne parlano.", supporting: [1], contradicting: [], quotes: [{ feedback: 1, stance: "for", text: "Feedback numero" }] },
        ],
      }
    )
    await synthesize(user.researchId)
    const [listed] = await listHypotheses(research())
    expect(listed.id).toBe(hypothesis)
    expect(listed.verdict).toMatchObject({ verdict: "confirmed", feedbackRead: 37, arrivedAfter: 8, supporting: 1, arrivedAfterVerdict: 0 })
  })

  it("themes fail and verdict succeeds: S5 and usage 1", async () => {
    await addFeedback()
    const hypotheses = await addHypotheses(["La banca si scollega", "Vogliono WhatsApp"])
    ai.model = fakeSynthesisModel(new Error("Anthropic API down"), priced)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await synthesize(user.researchId)).toEqual({
      ok: true,
      themes: "failed",
      themeCount: 0,
      verdict: "done",
      verdicts: { confirmed: 1, refuted: 0, toReview: 1 },
      previousThemesDate: null,
    })
    log.mockRestore()
    const { themes, verdict } = await byKind()
    expect([themes[0].status, verdict[0].status]).toEqual(["failed", "done"])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(1)
    expect((await verdictsOf(hypotheses)).map((v) => v?.verdict)).toEqual(["confirmed", "to_review"])
  })

  it("themes fail after an earlier analysis: the earlier themes stay and their date comes back", async () => {
    await addFeedback()
    answer({ themes: [bank] })
    await synthesize(user.researchId)
    const [earlier] = await analyses()
    await addHypotheses(["La banca si scollega", "Vogliono WhatsApp"])
    ai.model = fakeSynthesisModel({ themes: [] }, priced)
    const result = await synthesize(user.researchId)
    expect(result).toMatchObject({ ok: true, themes: "no_themes", verdict: "done" })
    const { data } = await admin.from("analyses").select("created_at").eq("id", earlier.id).single()
    expect(result).toMatchObject({ previousThemesDate: isoDateOf(new Date(data!.created_at)) })
    expect((await getDashboard(research(), { status: "all" })).analysis?.id).toBe(earlier.id)
  })

  it("verdict fails and themes succeed: S6 and usage 1, the previous verdict stays", async () => {
    await addFeedback()
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const hypotheses = await addHypotheses(["La banca si scollega", "Vogliono WhatsApp"])
    ai.model = fakeSynthesisModel({ themes: [bank] }, priced)
    await synthesize(user.researchId)
    const before = await verdictsOf(hypotheses)

    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    ai.model = fakeSynthesisModel({ themes: [bank] }, new Error("Anthropic API down"))
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themes: "done", themeCount: 1, verdict: "failed", verdicts: { confirmed: 0, refuted: 0, toReview: 0 } })
    log.mockRestore()
    const { themes, verdict } = await byKind()
    expect(themes.map((a) => a.status)).toEqual(["done", "done"])
    expect(verdict.map((a) => a.status)).toEqual(["done", "failed"])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(3)
    expect(await verdictsOf(hypotheses)).toEqual(before)
    const log2 = await runLog(verdict[1].id)
    expect(log2.error).toContain("Anthropic API down")
    expect(log2.finished_at).not.toBeNull()
  })

  it("both fail: S7 and usage 0", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    ai.model = fakeSynthesisModel(new Error("down"), "non è JSON")
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "failed" })
    log.mockRestore()
    expect((await analyses()).map((a) => a.status)).toEqual(["failed", "failed"])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(0)
  })

  it("no themes and a failed verdict: nothing done, no_themes", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    ai.model = fakeSynthesisModel({ themes: [] }, new Error("down"))
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "no_themes" })
    log.mockRestore()
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(0)
  })

  it("a verdict out of schema fails the verdict part and keeps the raw text", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const wrong = { hypotheses: [{ ...priced.hypotheses[0], quotes: [{ feedback: 1, stance: "neutral", text: "si scollega" }] }] }
    ai.model = fakeSynthesisModel({ themes: [bank] }, wrong)
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themes: "done", verdict: "failed" })
    log.mockRestore()
    const { verdict } = await byKind()
    const logged = await runLog(verdict[0].id)
    expect(logged.error).toContain("NoObjectGeneratedError")
    expect(logged.output).toBe(JSON.stringify(wrong))
  })

  it("an invented quote is dropped, and the confirmed left without quotes is saved to_review", async () => {
    await addFeedback()
    const [hypothesis] = await addHypotheses(["La banca si scollega"])
    const invented = {
      hypotheses: [{ ...priced.hypotheses[0], contradicting: [], quotes: [{ feedback: 1, stance: "for", text: "La banca è la migliore del mercato" }] }],
    }
    ai.model = fakeSynthesisModel({ themes: [bank] }, invented)
    await synthesize(user.researchId)
    const [saved] = await verdictsOf([hypothesis])
    expect(saved).toMatchObject({ verdict: "to_review" })
    expect(saved!.verdict_feedback.every((l) => l.highlight === null)).toBe(true)
    const { verdict } = await byKind()
    expect((await runLog(verdict[0].id)).issues).toEqual([
      { hypothesis: 1, problem: "quote_not_in_feedback", detail: 1 },
      { hypothesis: 1, problem: "verdict_without_quotes" },
    ])
  })

  it("both calls start together with a 240,000 ms timeout and 16,000 output tokens", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    const inner = fakeSynthesisModel({ themes: [bank] }, priced)
    let started = 0
    let bothStarted = () => {}
    const together = new Promise<void>((resolve) => (bothStarted = resolve))
    ai.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        if (++started === 2) bothStarted()
        // Neither call answers until the other has started: in sequence this would never finish.
        await together
        return inner.doGenerate(options)
      },
    })
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themes: "done", verdict: "done" })
    expect(calls.options).toHaveLength(2)
    for (const options of calls.options) expect(options).toMatchObject({ timeout: 240_000, maxOutputTokens: 16_000 })
  })

  it("every analyses row has its analysis_runs row: the verdict with model, instructions, prompt, feedback and hypothesis ids in order", async () => {
    const ids = await addFeedback()
    const hypotheses = await addHypotheses(["La banca si scollega", "Vogliono WhatsApp"])
    ui.locale = "en"
    ai.model = fakeSynthesisModel({ themes: [bank] }, priced, { input: 100_000, output: 10_000 })
    await synthesize(user.researchId)
    const { verdict, themes } = await byKind()
    expect((await runLog(themes[0].id)).input).toMatchObject({ instructions: analysisInstructions("en") })
    const logged = await runLog(verdict[0].id)
    expect(logged).toMatchObject({
      workspace_id: user.workspaceId,
      model: "claude-sonnet-5",
      input_tokens: 100_000,
      output_tokens: 10_000,
      cost_usd: 0.3,
      error: null,
      output: priced,
      issues: [],
    })
    expect(logged.duration_ms).toBeGreaterThanOrEqual(0)
    expect(logged.finished_at).not.toBeNull()
    const input = logged.input as { instructions: string; prompt: string; feedback_ids: string[]; hypothesis_ids: string[] }
    expect(input.instructions).toBe(verdictInstructions("en"))
    expect(input.feedback_ids).toEqual(ids)
    expect(input.hypothesis_ids).toEqual(hypotheses)
    expect(input.prompt).toContain('<hypotheses_data>[{"n":1,"text":"La banca si scollega"},{"n":2,"text":"Vogliono WhatsApp"}]</hypotheses_data>')
    expect(input.prompt).toContain("Il commercialista vorrebbe un accesso suo.")
  })

  it("a verdict model error logs only the error name and the analysis id, never the marker", async () => {
    await addFeedback([...TEXTS.slice(0, 4), `Feedback con ${MARKER}`])
    await addHypotheses([`Ipotesi con ${MARKER}`])
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    ai.model = fakeSynthesisModel({ themes: [bank] }, new Error(`Invalid request near ${MARKER}`))
    await synthesize(user.researchId)
    const { verdict } = await byKind()
    const logged = log.mock.calls.map((args) => args.map(String).join(" "))
    log.mockRestore()
    expect(logged.some((line) => line.includes(verdict[0].id))).toBe(true)
    expect(logged.every((line) => !line.includes(MARKER))).toBe(true)
  })

  it("the hypotheses stay locked while the verdict runs", async () => {
    await addFeedback()
    const [hypothesis] = await addHypotheses(["La banca si scollega"])
    const inner = fakeSynthesisModel({ themes: [bank] }, priced)
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    let called = () => {}
    const modelCalled = new Promise<void>((resolve) => (called = resolve))
    ai.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        called()
        await held
        return inner.doGenerate(options)
      },
    })
    const running = synthesize(user.researchId)
    await modelCalled
    const { error } = await user.client.from("research_hypotheses").update({ text: "Cambiata" }).eq("id", hypothesis)
    expect(error?.message).toBe("analysis_running")
    release()
    expect(await running).toMatchObject({ ok: true, verdict: "done" })
  })
})

// ===== The quota of the verdict and "Solo il verdetto" =====

describe("synthesize and the quota of the verdict", () => {
  it("with 1 analysis left and hypotheses the server reserves only themes, even when asked for both", async () => {
    await addFeedback()
    const hypotheses = await addHypotheses(["La banca si scollega"])
    await insertAnalyses(2, "done")
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId)).toEqual({
      ok: true,
      themes: "done",
      themeCount: 1,
      verdict: "limit",
      verdicts: { confirmed: 0, refuted: 0, toReview: 0 },
      // The 2 analyses used this month are themes analyses too.
      previousThemesDate: expect.any(String),
    })
    expect(model.doGenerateCalls).toHaveLength(1)
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).not.toContain("<hypotheses_data>")
    const { themes, verdict } = await byKind()
    expect([themes.length, verdict.length]).toEqual([3, 0])
    expect(await verdictsOf(hypotheses)).toEqual([undefined])
    expect(analytics.trackEvent).toHaveBeenLastCalledWith(
      user.workspaceId,
      expect.objectContaining({ properties: expect.objectContaining({ hypothesis_count: 0 }) })
    )
  })

  it("with no analysis left and hypotheses: limit, no call", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    await insertAnalyses(3, "done")
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it("verdict only reserves one verdict row and redoes every hypothesis", async () => {
    await addFeedback()
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const hypotheses = await addHypotheses(["La banca si scollega"])
    ai.model = fakeSynthesisModel({ themes: [bank] }, priced)
    await synthesize(user.researchId)
    const [firstVerdict] = (await byKind()).verdict
    hypotheses.push(...(await addHypotheses(["Vogliono WhatsApp"])))

    const model = fakeSynthesisModel(new Error("the themes must not be called"), priced)
    ai.model = model
    analytics.trackMilestone.mockClear()
    expect(await synthesize(user.researchId, "verdict")).toEqual({
      ok: true,
      themes: "skipped",
      themeCount: 0,
      verdict: "done",
      verdicts: { confirmed: 1, refuted: 0, toReview: 1 },
      previousThemesDate: expect.any(String),
    })
    expect(model.doGenerateCalls).toHaveLength(1)
    const { themes, verdict } = await byKind()
    expect([themes.length, verdict.length]).toEqual([1, 2])
    const newVerdict = verdict.find((v) => v.id !== firstVerdict.id)!
    expect((await verdictsOf(hypotheses)).map((v) => [v?.analysis_id, v?.verdict])).toEqual([
      [newVerdict.id, "confirmed"],
      [newVerdict.id, "to_review"],
    ])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(3)
    expect(analytics.trackMilestone).not.toHaveBeenCalledWith(user.workspaceId, expect.anything())
  })

  it("verdict only with the analyses used up: a forced submit gets limit from the database and makes no model call", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    await insertAnalyses(3, "done")
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId, "verdict")).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it("verdict only without hypotheses reserves nothing and makes no call", async () => {
    await addFeedback()
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId, "verdict")).toEqual({ ok: false, reason: "failed" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await analyses()).toEqual([])
  })
})

describe("synthesize from the room", () => {
  it("room mode reserves only themes with hypotheses: one row, one call, no verdict", async () => {
    await addFeedback()
    const hypotheses = await addHypotheses(["La banca si scollega"])
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId, "room")).toMatchObject({ ok: true, themes: "done", verdict: "skipped" })
    expect(model.doGenerateCalls).toHaveLength(1)
    expect((await analyses()).map((a) => a.kind)).toEqual(["themes"])
    expect(await verdictsOf(hypotheses)).toEqual([undefined])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(1)
  })

  it("room mode with the analyses used up: limit from the database and no model call", async () => {
    await addFeedback()
    await addHypotheses(["La banca si scollega"])
    await insertAnalyses(3, "done")
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    ai.model = model
    expect(await synthesize(user.researchId, "room")).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
  })
})

describe("synthesize and the question of the Research", () => {
  it("neither the themes nor the verdict prompt contains the Research question", async () => {
    await admin.from("research").update({ question: `Domanda ${MARKER}?` }).eq("id", user.researchId)
    try {
      await addFeedback()
      await addHypotheses(["La banca si scollega"])
      const model = fakeSynthesisModel({ themes: [bank] }, priced)
      ai.model = model
      expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themes: "done", verdict: "done" })
      expect(model.doGenerateCalls).toHaveLength(2)
      expect(JSON.stringify(model.doGenerateCalls)).not.toContain(MARKER)
      const { themes, verdict } = await byKind()
      expect(JSON.stringify([(await runLog(themes[0].id)).input, (await runLog(verdict[0].id)).input])).not.toContain(MARKER)
    } finally {
      await admin.from("research").update({ question: "Domanda di prova?" }).eq("id", user.researchId)
    }
  })
})

describe("synthesize and a Research deleted during its analysis", () => {
  it("both parts fail with research_deleted: no theme, no verdict, no text in the logs, nothing counted", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const created = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Da eliminare?" })
    const researchId = created.data!
    const { data: feedback } = await admin
      .from("feedback")
      .insert(TEXTS.map((text) => ({ workspace_id: user.workspaceId, research_id: researchId, text, channel: "Supporto" })))
      .select("id")
    await admin.from("research_hypotheses").insert({ workspace_id: user.workspaceId, research_id: researchId, text: "La banca si scollega" })
    // The PM deletes the Research while the model is answering.
    const model = fakeSynthesisModel({ themes: [bank] }, priced)
    let deleted: PromiseLike<unknown> | null = null
    ai.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        deleted ??= admin.from("research").delete().eq("id", researchId)
        await deleted
        return model.doGenerate(options)
      },
    })
    expect(await synthesize(researchId)).toEqual({ ok: false, reason: "failed" })
    log.mockRestore()

    const rows = (await analyses()).filter((a) => a.research_id === null)
    expect(rows.map((a) => [a.kind, a.status]).sort()).toEqual([
      ["themes", "failed"],
      ["verdict", "failed"],
    ])
    for (const row of rows) {
      const run = await runLog(row.id)
      expect(run.error).toContain("research_deleted")
      expect([run.input, run.output, run.issues]).toEqual([null, null, null])
    }
    const { count } = await admin.from("themes").select("id", { count: "exact", head: true }).in("analysis_id", rows.map((a) => a.id))
    expect(count).toBe(0)
    expect(feedback).toHaveLength(TEXTS.length)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(0)
  })
})

function themeRow(theme: typeof bank | typeof phone) {
  return {
    title: theme.title,
    summary: theme.summary,
    kind: theme.kind,
    sentiment: theme.sentiment,
    priority: null,
    status: "to_review",
  }
}
