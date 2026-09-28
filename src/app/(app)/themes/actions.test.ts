import { MockLanguageModelV4 } from "ai/test"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { RawOutput } from "@/lib/analysis"
import { isoDateOf } from "@/lib/format"
import { fakeModel } from "@/test/fake-model"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The analysis runs for real against the local database, as a fresh test user.
// The model is always fake: no call leaves the machine.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
// Which activation events the action asks for. Sending them is tested in src/lib/analytics.test.ts.
const analytics = vi.hoisted(() => ({ trackMilestone: vi.fn() }))
vi.mock("@/lib/analytics", () => analytics)
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))

// The language of the interface when the analysis starts. Italian unless a test says otherwise.
const ui = vi.hoisted(() => ({ locale: "it" }))
vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getLocale: async () => ui.locale,
}))

const { analyze } = await import("./actions")
const { analysisInstructions } = await import("@/lib/analysis")
const { deleteFeedback } = await import("@/app/(app)/research/[id]/feedback/actions")
const { getDashboard, getUsage } = await import("@/lib/data")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("analysis")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  session.client = user.client
  ui.locale = "it"
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
    .select("id, status, feedback_count, period_start")
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
    period_start: daysAgo(30),
    feedback_count: 1,
    status,
    created_at: createdAt.toISOString(),
  }))
  const { error } = await admin.from("analyses").insert(rows)
  if (error) throw error
}

describe("analyze", () => {
  it("saves themes, links, quotes, sentiment and the run log", async () => {
    const ids = await addFeedback()
    const model = answer({ themes: [bank, phone] })

    expect(await analyze()).toEqual({ ok: true })

    const [analysis] = await analyses()
    expect(analysis).toMatchObject({ status: "done", feedback_count: 5, period_start: daysAgo(4) })
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
    const dashboard = await getDashboard(user.workspaceId, { status: "all" })
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
    await analyze()
    const system = model.doGenerateCalls[0].prompt.filter((m) => m.role === "system")
    expect(system).toEqual([{ role: "system", content: analysisInstructions("en") }])
    const [analysis] = await analyses()
    expect((await runLog(analysis.id)).input).toMatchObject({ instructions: analysisInstructions("en") })
  })

  it("carries priority and status to the themes with the same title", async () => {
    await addFeedback()
    answer({ themes: [bank, phone] })
    await analyze()
    const [first] = await analyses()
    await user.client.from("themes").update({ priority: "high", status: "roadmap" }).eq("analysis_id", first.id).eq("title", bank.title)
    await user.client.from("themes").update({ status: "discarded" }).eq("analysis_id", first.id).eq("title", phone.title)

    // The model saw the existing titles and reused one, with different case and spaces.
    const model = answer({ themes: [{ ...bank, title: "  la banca SI scollega " }, { ...phone, title: "Un tema nuovo" }] })
    expect(await analyze()).toEqual({ ok: true })
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
    expect(await analyze()).toEqual({ ok: true })
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
    await analyze()
    const [done] = await analyses()

    for (const error of [new Error("Anthropic API down"), new DOMException("The operation timed out.", "TimeoutError")]) {
      failingModel(error)
      expect(await analyze()).toEqual({ ok: false, reason: "failed" })
    }

    const all = await analyses()
    expect(all.map((a) => a.status)).toEqual(["done", "failed", "failed"])
    expect((await runLog(all[1].id)).error).toContain("Anthropic API down")
    expect((await runLog(all[2].id)).error).toContain("TimeoutError")
    expect((await runLog(all[2].id)).finished_at).not.toBeNull()
    const dashboard = await getDashboard(user.workspaceId, { status: "all" })
    expect(dashboard.analysis?.id).toBe(done.id)
    expect(dashboard.themes.map((t) => t.title)).toEqual([bank.title])
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(1)
  })

  it("saves the raw text when the model answers in the wrong shape", async () => {
    await addFeedback()
    answer("Ecco i temi: banca e fatture")
    expect(await analyze()).toEqual({ ok: false, reason: "failed" })
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
    expect(await analyze()).toEqual({ ok: true })

    const model = answer({ themes: [bank] })
    expect(await analyze()).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(3)
  })

  it("failed runs cost tokens: at most as many as the quota each month", async () => {
    await addFeedback()
    await insertAnalyses(3, "failed")
    const model = answer({ themes: [bank] })
    expect(await analyze()).toEqual({ ok: false, reason: "limit" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(0)
  })

  it("an analysis with no theme left is failed: the previous one stays, the quota too", async () => {
    await addFeedback()
    answer({ themes: [bank] })
    await analyze()
    const [done] = await analyses()

    for (const output of [{ themes: [] }, { themes: [{ ...phone, feedback: [3] }] }]) {
      answer(output)
      expect(await analyze()).toEqual({ ok: false, reason: "no_themes" })
    }
    const all = await analyses()
    expect(all.map((a) => a.status)).toEqual(["done", "failed", "failed"])
    expect(await runLog(all[2].id)).toMatchObject({
      error: "no_themes",
      issues: [{ theme: phone.title, problem: "too_few_feedback", detail: 1 }],
      input_tokens: 100_000,
    })
    expect((await getDashboard(user.workspaceId, { status: "all" })).analysis?.id).toBe(done.id)
    expect((await getUsage(user.workspaceId)).analysesThisMonth).toBe(1)
  })

  it("Pro: 100 analyses a month, also after going back to Free only 3", async () => {
    await addFeedback()
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    await insertAnalyses(99, "done")
    answer({ themes: [bank] })
    expect(await analyze()).toEqual({ ok: true })
    expect(await analyze()).toEqual({ ok: false, reason: "limit" })

    await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
    expect(await analyze()).toEqual({ ok: false, reason: "limit" })
  })

  it("runs one analysis at a time, and frees a stuck one after 10 minutes", async () => {
    await addFeedback()
    await insertAnalyses(1, "running", new Date(Date.now() - 2 * 60 * 1000))
    const model = answer({ themes: [bank] })
    expect(await analyze()).toEqual({ ok: false, reason: "busy" })
    expect(model.doGenerateCalls).toHaveLength(0)

    await admin.from("analyses").delete().eq("workspace_id", user.workspaceId)
    await insertAnalyses(1, "running", new Date(Date.now() - 11 * 60 * 1000))
    expect(await analyze()).toEqual({ ok: true })
    expect((await analyses()).map((a) => a.status)).toEqual(["failed", "done"])
  })

  it("asks for the first analysis event with counts only, and not when the analysis fails", async () => {
    await addFeedback()
    analytics.trackMilestone.mockClear()
    answer("non è JSON")
    expect(await analyze()).toEqual({ ok: false, reason: "failed" })
    expect(analytics.trackMilestone).not.toHaveBeenCalled()
    answer({ themes: [bank, phone] })
    expect(await analyze()).toEqual({ ok: true })
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
    const clicks = [analyze(), analyze()]
    expect(await Promise.race(clicks)).toEqual({ ok: false, reason: "busy" })
    release()
    const results = await Promise.all(clicks)
    expect(results).toContainEqual({ ok: true })
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
    const running = analyze()
    await modelCalled
    expect(await deleteFeedback(ids[0])).toEqual({ ok: true })
    release()
    expect(await running).toEqual({ ok: true })

    const [analysis] = await analyses()
    expect(analysis.status).toBe("done")
    const themes = await themesOf(analysis.id)
    expect(themes.map((t) => [t.title, t.theme_feedback.map((l) => [l.feedback_id, l.quote_rank, l.highlight])])).toEqual([
      [phone.title, expect.arrayContaining([[ids[2], null, null], [ids[3], 1, "velocissimo"]])],
      [bank.title, [[ids[1], 2, "ricollegare la banca ogni settimana"]]],
    ])
    const dashboard = await getDashboard(user.workspaceId, { status: "all" })
    expect(dashboard.themes.map((t) => [t.title, t.feedbackCount])).toEqual([
      [phone.title, 2],
      [bank.title, 1],
    ])
  })

  it("needs feedback from the last 90 days, today included", async () => {
    await addFeedback(["Vecchio feedback"], 90)
    const model = answer({ themes: [bank] })
    expect(await analyze()).toEqual({ ok: false, reason: "no_feedback" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await analyses()).toEqual([])
  })

  it("sends at most the 500 most recent feedback of the last 90 days", async () => {
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const rows = Array.from({ length: 510 }, (_, i) => ({
      workspace_id: user.workspaceId,
      research_id: user.researchId,
      text: `Feedback ${i}`,
      channel: "Supporto",
      received_at: daysAgo(Math.floor(i / 10)),
    }))
    await admin.from("feedback").insert(rows)
    await addFeedback(["Troppo vecchio"], 95)
    const model = answer({ themes: [bank] })
    expect(await analyze()).toEqual({ ok: true })

    const [analysis] = await analyses()
    expect(analysis).toMatchObject({ feedback_count: 500, period_start: daysAgo(49) })
    const input = (await runLog(analysis.id)).input as { feedback_ids: string[]; prompt: string }
    expect(input.feedback_ids).toHaveLength(500)
    expect(input.prompt).not.toContain("Feedback 505")
    expect(input.prompt).not.toContain("Troppo vecchio")
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain('\\"n\\":500')
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
