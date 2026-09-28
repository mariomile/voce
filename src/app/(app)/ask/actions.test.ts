import { MockLanguageModelV4 } from "ai/test"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { RawAnswer } from "@/lib/questions"
import { isoDateOf } from "@/lib/format"
import { fakeModel } from "@/test/fake-model"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The question runs for real against the local database, as a fresh test user.
// The model is always fake: no call leaves the machine.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
// Which events the action asks for. Sending them is tested in src/lib/analytics.test.ts.
const analytics = vi.hoisted(() => ({ trackEvent: vi.fn(), trackMilestone: vi.fn() }))
vi.mock("@/lib/analytics", () => analytics)
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))
vi.mock("@/lib/supabase/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/admin")>()
  return { ...actual, questionUsage: vi.fn(actual.questionUsage) }
})

// The language of the interface when the question is asked. Italian unless a test says otherwise.
const ui = vi.hoisted(() => ({ locale: "it" }))
vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getLocale: async () => ui.locale,
}))

const { ask } = await import("./actions")
const { questionInstructions } = await import("@/lib/questions")
const { getUsage } = await import("@/lib/data")
const { questionUsage } = await import("@/lib/supabase/admin")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("ask")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  session.client = user.client
  ui.locale = "it"
  analytics.trackEvent.mockClear()
  await admin.from("questions").delete().eq("workspace_id", user.workspaceId)
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
})

const TEXTS = [
  "La banca si scollega ogni lunedì.",
  "Devo ricollegare la banca ogni settimana, che fatica.",
  "Adoro l'invio delle fatture dal telefono.",
]

const daysAgo = (days: number) => isoDateOf(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

// One feedback per day, newest first: the model sees text i as number i + 1.
async function addFeedback(texts = TEXTS, firstDaysAgo = 0) {
  const rows = texts.map((text, i) => ({
    workspace_id: user.workspaceId,
    text,
    channel: "Supporto",
    customer: "Mario Rossi",
    received_at: daysAgo(firstDaysAgo + i),
  }))
  const { data, error } = await admin.from("feedback").insert(rows).select("id, text")
  if (error) throw error
  return texts.map((t) => data.find((d) => d.text === t)!.id)
}

const bank: RawAnswer = {
  answer: "La banca si scollega spesso e va ricollegata a mano.",
  feedback: [1, 1, 2, 999],
  quotes: [
    { feedback: 1, text: "si scollega ogni lunedì" },
    { feedback: 2, text: "ricollegare la banca ogni settimana" },
  ],
}

function reply(output: RawAnswer | string) {
  const model = fakeModel(output, { input: 100_000, output: 1_000 })
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

async function insertQuestions(count: number, status: "done" | "failed" | "running", createdAt = new Date()) {
  const rows = Array.from({ length: count }, () => ({
    workspace_id: user.workspaceId,
    status,
    outcome: status === "done" ? ("answered" as const) : null,
    feedback_considered: 1,
    created_at: createdAt.toISOString(),
  }))
  const { error } = await admin.from("questions").insert(rows)
  if (error) throw error
}

const promptOf = (model: MockLanguageModelV4, call = 0) => JSON.stringify(model.doGenerateCalls[call].prompt)

async function questions() {
  const { data } = await admin
    .from("questions")
    .select("id, status, outcome, feedback_considered, feedback_count, citation_count")
    .eq("workspace_id", user.workspaceId)
    .order("created_at")
  return data!
}

async function runLog(questionId: string) {
  const { data } = await admin.from("question_runs").select("*").eq("question_id", questionId).single()
  return data!
}

describe("ask", () => {
  it("answers with the server count, the verified quotes with channel and date, and no customer", async () => {
    await addFeedback()
    reply(bank)

    const result = await ask({ question: "Cosa dicono\ndella banca?" })

    expect(result).toEqual({
      ok: true,
      outcome: "answered",
      question: "Cosa dicono della banca?",
      answer: bank.answer,
      feedbackCount: 2,
      feedbackConsidered: 3,
      feedbackInWindow: 3,
      quotes: [
        { text: TEXTS[0], highlight: "si scollega ogni lunedì", channel: "Supporto", receivedAt: daysAgo(0) },
        { text: TEXTS[1], highlight: "ricollegare la banca ogni settimana", channel: "Supporto", receivedAt: daysAgo(1) },
      ],
      usage: { used: 1, quota: 10 },
    })
    expect(JSON.stringify(result)).not.toContain("Mario Rossi")
  })

  it("saves feedback_count from the server count", async () => {
    await addFeedback()
    reply(bank)
    await ask({ question: "Cosa dicono della banca?" })
    expect(await questions()).toEqual([
      {
        id: expect.any(String),
        status: "done",
        outcome: "answered",
        feedback_considered: 3,
        feedback_count: 2,
        citation_count: 2,
      },
    ])
  })

  it("logs the run: input, output, issues, tokens, duration, cost", async () => {
    const ids = await addFeedback()
    reply(bank)
    await ask({ question: "Cosa dicono della banca?" })
    const [question] = await questions()
    const log = await runLog(question.id)
    expect(log).toMatchObject({
      workspace_id: user.workspaceId,
      model: "claude-sonnet-5",
      output: bank,
      issues: [{ part: "feedback", problem: "unknown_feedback", detail: 999 }],
      input_tokens: 100_000,
      output_tokens: 1_000,
      cost_usd: 0.21,
      error: null,
    })
    expect(log.duration_ms).toBeGreaterThanOrEqual(0)
    expect(log.finished_at).not.toBeNull()
    const input = log.input as { instructions: string; prompt: string; feedback_ids: string[] }
    expect(input.feedback_ids).toEqual(ids)
    expect(input.prompt).toContain("Cosa dicono della banca?")
    expect(input.prompt).toContain(TEXTS[2])
    expect(input.instructions).not.toContain("banca")
  })

  it("asks the model to answer in the language of the interface", async () => {
    await addFeedback()
    ui.locale = "en"
    const model = reply(bank)
    await ask({ question: "What do they say about the bank?" })
    const system = model.doGenerateCalls[0].prompt.filter((m) => m.role === "system")
    expect(system.map((m) => m.content)).toEqual([questionInstructions("en")])
    const [question] = await questions()
    expect((await runLog(question.id)).input).toMatchObject({ instructions: questionInstructions("en") })
  })

  it("no verified quote is no_evidence and returns no model text", async () => {
    await addFeedback()
    reply({ answer: "Nessuno ne parla, ma la privacy è importante.", feedback: [3], quotes: [{ feedback: 3, text: "non c'è" }] })
    const result = await ask({ question: "Cosa dicono della privacy?" })
    expect(result).toEqual({
      ok: true,
      outcome: "no_evidence",
      question: "Cosa dicono della privacy?",
      feedbackConsidered: 3,
      feedbackInWindow: 3,
      usage: { used: 1, quota: 10 },
    })
    const [question] = await questions()
    expect(question).toMatchObject({ status: "done", outcome: "no_evidence", feedback_count: 1, citation_count: 0 })
  })

  it("shows the answer even if the quota cannot be read after the question is closed", async () => {
    await addFeedback()
    reply(bank)
    vi.mocked(questionUsage).mockRejectedValueOnce(new Error("db blip"))
    const result = await ask({ question: "Cosa dicono della banca?" })
    expect(result).toEqual({
      ok: true,
      outcome: "answered",
      question: "Cosa dicono della banca?",
      answer: bank.answer,
      feedbackCount: 2,
      feedbackConsidered: 3,
      feedbackInWindow: 3,
      quotes: [
        { text: TEXTS[0], highlight: "si scollega ogni lunedì", channel: "Supporto", receivedAt: daysAgo(0) },
        { text: TEXTS[1], highlight: "ricollegare la banca ogni settimana", channel: "Supporto", receivedAt: daysAgo(1) },
      ],
      usage: null,
    })
    // The question is still closed as answered: only the quota read afterward failed.
    const [question] = await questions()
    expect(question).toMatchObject({ status: "done", outcome: "answered" })
  })

  it("asks for question_answered once, for answered and for no_evidence, with counts only", async () => {
    await addFeedback()
    reply(bank)
    await ask({ question: "Cosa dicono della banca?" })
    expect(analytics.trackEvent).toHaveBeenCalledExactlyOnceWith(user.workspaceId, {
      event: "question_answered",
      properties: { citation_count: 2, outcome: "answered" },
    })
    analytics.trackEvent.mockClear()
    reply({ answer: "Nessuno.", feedback: [], quotes: [] })
    await ask({ question: "E della privacy?" })
    expect(analytics.trackEvent).toHaveBeenCalledExactlyOnceWith(user.workspaceId, {
      event: "question_answered",
      properties: { citation_count: 0, outcome: "no_evidence" },
    })
    expect(analytics.trackMilestone).not.toHaveBeenCalled()
  })
})

describe("ask: guards before the model", () => {
  it("returns limit with the quota and plan read fresh from the server", async () => {
    await addFeedback()
    await insertQuestions(10, "done")
    const model = reply(bank)
    expect(await ask({ question: "La banca?" })).toEqual({
      ok: false,
      reason: "limit",
      usage: { used: 10, quota: 10 },
      plan: "free",
    })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it("returns the Pro quota and plan when the plan changed after the page was opened", async () => {
    // The page can be open on Free while another tab (or Mario) upgrades the workspace: the reason
    // must reflect the plan at the moment of the request, not the one read when the page loaded.
    await addFeedback()
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    await insertQuestions(100, "done")
    const model = reply(bank)
    expect(await ask({ question: "La banca?" })).toEqual({
      ok: false,
      reason: "limit",
      usage: { used: 100, quota: 100 },
      plan: "pro",
    })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it("returns busy without calling the model", async () => {
    await addFeedback()
    await insertQuestions(1, "running", new Date(Date.now() - 60 * 1000))
    const model = reply(bank)
    expect(await ask({ question: "La banca?" })).toEqual({ ok: false, reason: "busy" })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it("empty, blank and 301-character questions are invalid, no row, no call", async () => {
    await addFeedback()
    const model = reply(bank)
    for (const question of ["", "   \n  ", "a".repeat(301), ` ${"a".repeat(301)} `])
      expect(await ask({ question })).toEqual({ ok: false, reason: "invalid" })
    // Only the question: extra fields, such as a workspace id, are refused.
    expect(await ask({ question: "La banca?", workspaceId: "x" } as never)).toEqual({ ok: false, reason: "invalid" })
    expect(await ask(null as never)).toEqual({ ok: false, reason: "invalid" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await questions()).toEqual([])
    // 300 characters after the trim are fine.
    expect(await ask({ question: `  ${"a".repeat(300)}  ` })).toMatchObject({ ok: true })
  })

  it("needs feedback from the last 90 days, today included", async () => {
    await addFeedback(["Vecchio feedback"], 90)
    const model = reply(bank)
    expect(await ask({ question: "La banca?" })).toEqual({ ok: false, reason: "no_feedback" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await questions()).toEqual([])
  })

  it("without a session returns session, no row, no call", async () => {
    await addFeedback()
    session.client = anon()
    const model = reply(bank)
    expect(await ask({ question: "La banca?" })).toEqual({ ok: false, reason: "session" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await questions()).toEqual([])
  })
})

describe("ask: failures after the model is called", () => {
  it("model error is failed and counted", async () => {
    await addFeedback()
    failingModel(new Error("Anthropic API down"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await ask({ question: "La banca?" })).toEqual({ ok: false, reason: "failed", usage: { used: 1, quota: 10 } })
    log.mockRestore()
    const [question] = await questions()
    expect(question.status).toBe("failed")
    const run = await runLog(question.id)
    expect(run.error).toContain("Anthropic API down")
    expect(run.finished_at).not.toBeNull()
    expect((await getUsage(user.workspaceId)).questionsThisMonth).toBe(1)
  })

  it("a model slower than 60 s is failed and counted", async () => {
    await addFeedback()
    // What the SDK throws when the 60-second signal fires (the signal itself is checked in questions.test.ts).
    failingModel(new DOMException("The operation timed out.", "TimeoutError"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await ask({ question: "La banca?" })).toMatchObject({ ok: false, reason: "failed" })
    log.mockRestore()
    const [question] = await questions()
    expect(question.status).toBe("failed")
    expect((await runLog(question.id)).error).toContain("TimeoutError")
    expect((await getUsage(user.workspaceId)).questionsThisMonth).toBe(1)
  })

  it("output out of schema is failed and counted, raw text saved", async () => {
    await addFeedback()
    reply("Ecco la risposta: la banca si scollega")
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await ask({ question: "La banca?" })).toMatchObject({ ok: false, reason: "failed" })
    log.mockRestore()
    const [question] = await questions()
    expect(question.status).toBe("failed")
    const run = await runLog(question.id)
    expect(run).toMatchObject({ output: "Ecco la risposta: la banca si scollega", input_tokens: 100_000, cost_usd: 0.21 })
    expect(run.error).toContain("NoObjectGeneratedError")
    expect((await getUsage(user.workspaceId)).questionsThisMonth).toBe(1)
  })

  it("logs only the error name and the question id", async () => {
    await addFeedback(["Il marcatore ZZSEGRETOZZ è nel feedback."])
    failingModel(new Error("Anthropic API down on ZZSEGRETOZZ"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    await ask({ question: "Cosa dice ZZSEGRETOZZ?" })
    const [question] = await questions()
    expect(log).toHaveBeenCalledWith(`Question ${question.id} failed:`, "Error")
    expect(JSON.stringify(log.mock.calls)).not.toContain("ZZSEGRETOZZ")
    log.mockRestore()
  })
})

describe("ask: what reaches the model", () => {
  it("sends at most the 500 most recent feedback of the last 90 days", async () => {
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    const rows = Array.from({ length: 501 }, (_, i) => ({
      workspace_id: user.workspaceId,
      text: `Feedback numero ${i}.`,
      channel: "Supporto",
      received_at: daysAgo(Math.floor(i / 10)),
    }))
    await admin.from("feedback").insert(rows)
    await addFeedback(["Troppo vecchio"], 95)
    const model = reply({ answer: "x", feedback: [1], quotes: [{ feedback: 1, text: "Feedback numero" }] })
    expect(await ask({ question: "Cosa dicono?" })).toMatchObject({ ok: true, feedbackConsidered: 500, feedbackInWindow: 501 })
    const [question] = await questions()
    expect(question.feedback_considered).toBe(500)
    const input = (await runLog(question.id)).input as { feedback_ids: string[]; prompt: string }
    expect(input.feedback_ids).toHaveLength(500)
    expect(input.prompt).toContain("Feedback numero 0.")
    expect(input.prompt).not.toContain("Feedback numero 500.")
    expect(input.prompt).not.toContain("Troppo vecchio")
    expect(promptOf(model)).toContain('\\"n\\":500')
  })

  it("a second question's prompt carries nothing from the first", async () => {
    await addFeedback()
    reply(bank)
    await ask({ question: "Cosa dicono della banca?" })
    const model = reply({ answer: "Adorano le fatture dal telefono.", feedback: [3], quotes: [{ feedback: 3, text: "Adoro" }] })
    await ask({ question: "E delle fatture?" })
    const prompt = promptOf(model)
    expect(prompt).toContain("E delle fatture?")
    expect(prompt).not.toContain("Cosa dicono della banca?")
    expect(prompt).not.toContain(bank.answer)
  })
})
