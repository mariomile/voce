import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { RawAnswer } from "@/lib/questions"
import { isoDateOf } from "@/lib/format"
import { fakeModel } from "@/test/fake-model"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

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

const { ask } = await import("./actions")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("ask")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  session.client = user.client
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
      model: "anthropic/claude-sonnet-5",
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
