import { MockLanguageModelV4 } from "ai/test"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { isoDateOf } from "@/lib/format"
import type { RawReport } from "@/lib/report"
import { fakeModel, themesOutput, verdictOutput } from "@/test/fake-model"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The report runs for real against the local database, as a fresh test user, after a real synthesis with a fake
// model. The model is always fake: no call leaves the machine.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
const analytics = vi.hoisted(() => ({ trackMilestone: vi.fn(), trackEvent: vi.fn() }))
vi.mock("@/lib/analytics", () => analytics)
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))
const ui = vi.hoisted(() => ({ locale: "it" }))
vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getLocale: async () => ui.locale,
}))

const { generateReport } = await import("./actions")
const { synthesize, addHypothesis } = await import("../actions")
const { getLatestReport, getUsage } = await import("@/lib/data")
const { reportInstructions } = await import("@/lib/report")

let user: TestUser
let other: TestUser

beforeAll(async () => {
  ;[user, other] = await Promise.all([createTestUser("report"), createTestUser("report-other")])
})

afterAll(() => deleteTestUsers([user, other]))

beforeEach(async () => {
  session.client = user.client
  ui.locale = "it"
  analytics.trackEvent.mockClear()
  await admin.from("research_hypotheses").delete().eq("workspace_id", user.workspaceId)
  await admin.from("analyses").delete().eq("workspace_id", user.workspaceId)
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
})

const TEXTS = [
  "Il prezzo per utente pesa sui team piccoli come il nostro.",
  "Siamo in tre e Pro costa troppo per noi.",
  "Esportare in PDF i report ci farebbe risparmiare ore.",
  "Ci serve il PDF per mandare i report al cliente.",
  "Per noi il prezzo va bene, il problema è l'onboarding.",
]

const daysAgo = (days: number) => isoDateOf(new Date(Date.now() - days * 24 * 60 * 60 * 1000))

async function addFeedback(texts = TEXTS) {
  const rows = texts.map((text, i) => ({
    workspace_id: user.workspaceId,
    research_id: user.researchId,
    text,
    channel: i % 2 === 0 ? "Supporto" : "Intervista",
    received_at: daysAgo(i),
  }))
  const { error } = await admin.from("feedback").insert(rows)
  if (error) throw error
}

// A real synthesis of the 5 feedback with a fake model: two themes, and a confirmed verdict on one hypothesis.
async function synthesized() {
  await addFeedback()
  expect((await addHypothesis(user.researchId, "Il prezzo frena i team piccoli")).ok).toBe(true)
  ai.model = routedModel(null)
  const result = await synthesize(user.researchId)
  expect(result).toMatchObject({ ok: true, themes: "done", verdict: "done" })
}

const THEMES = themesOutput(
  [
    {
      title: "Il prezzo pesa sui team piccoli",
      summary: "Chi ha scritto trova Pro caro per pochi utenti.",
      kind: "problem",
      sentiment: "negative",
      feedback: [1, 2, 5],
      quotes: [
        { feedback: 1, text: "pesa sui team piccoli" },
        { feedback: 2, text: "Pro costa troppo" },
      ],
    },
    {
      title: "Chiedono l'esportazione in PDF",
      summary: "Il PDF serve a condividere i report.",
      kind: "opportunity",
      sentiment: "neutral",
      feedback: [3, 4],
      quotes: [{ feedback: 3, text: "Esportare in PDF" }],
    },
  ],
  5
)

const VERDICT = verdictOutput(
  [
    {
      hypothesis: 1,
      verdict: "confirmed",
      reasoning: "Chi ha scritto lo dice in modo esplicito.",
      supporting: [1, 2],
      contradicting: [5],
      quotes: [
        { feedback: 2, stance: "for", text: "Pro costa troppo per noi" },
        { feedback: 5, stance: "against", text: "il prezzo va bene" },
      ],
    },
  ],
  5
)

const REPORT: RawReport = {
  summary: [
    "Il prezzo frena i team piccoli: {H1.for} feedback a favore e {H1.against} contro, su {H1.read} letti.",
    "Il tema più grande è il prezzo, con {T1.count} feedback su {read}.",
    "Il 73% vuole uno sconto.",
  ],
  findings: [
    {
      theme: "T1",
      headline: "{T1.count} feedback su {read} dicono che Pro costa troppo per pochi.",
      why: "È il motivo per restare su Free.",
      quotes: [{ feedback: 2, text: "Pro costa troppo per noi" }],
    },
    {
      theme: "T2",
      headline: "Chi ha scritto chiede il PDF.",
      why: "Serve fuori dal team.",
      quotes: [{ feedback: 3, text: "risparmiare ore" }],
    },
  ],
  limits: ["Nessuno ha scritto dopo aver lasciato il prodotto."],
  decisions: [{ decision: "Prova un prezzo per i team piccoli", why: "È il tema più grande.", evidence: ["T1", "H1"] }],
}

// Themes, verdict and report told apart by their data block. report null: the report call fails the test.
function routedModel(report: unknown) {
  const themes = fakeModel(THEMES)
  const verdict = fakeModel(VERDICT)
  const reportModel = report === null ? null : fakeModel(report, { input: 12_000, output: 3_000 })
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const prompt = JSON.stringify(options.prompt)
      if (prompt.includes("<report_data>")) {
        if (!reportModel) throw new Error("unexpected report call")
        return reportModel.doGenerate(options)
      }
      return (prompt.includes("<hypotheses_data>") ? verdict : themes).doGenerate(options)
    },
  })
}

const reportCalls = (model: unknown) =>
  (model as MockLanguageModelV4).doGenerateCalls.filter((c) => JSON.stringify(c.prompt).includes("<report_data>"))

describe("generateReport", () => {
  it("writes the report from the synthesis, saves it with its cost, and counts it as 1 analysis", async () => {
    await synthesized()
    const before = await getUsage(user.workspaceId, new Date())
    const model = routedModel(REPORT)
    ai.model = model
    expect(await generateReport(user.researchId)).toEqual({ ok: true })

    const [call] = reportCalls(model)
    expect(JSON.stringify(call.prompt)).toContain("Il prezzo pesa sui team piccoli")
    expect(JSON.stringify(call.prompt)).toContain("Il prezzo frena i team piccoli")

    const report = await getLatestReport({ id: user.researchId, workspaceId: user.workspaceId })
    expect(report).not.toBeNull()
    expect(report!.locale).toBe("it")
    expect(report!.feedbackCount).toBe(5)
    expect(report!.newFeedback).toBe(0)
    expect(report!.newerSynthesisAt).toBeNull()
    const content = report!.content
    expect(content.question).toBe("Domanda di prova?")
    expect(content.summary).toEqual([
      "Il prezzo frena i team piccoli: 2 feedback a favore e 1 contro, su 5 letti.",
      "Il tema più grande è il prezzo, con 3 feedback su 5.",
    ])
    expect(content.findings.map((f) => [f.title, f.count, f.share, f.quotes.map((q) => q.highlight)])).toEqual([
      ["Il prezzo pesa sui team piccoli", 3, 60, ["Pro costa troppo per noi"]],
      ["Chiedono l'esportazione in PDF", 2, 40, ["risparmiare ore"]],
    ])
    expect(content.hypotheses[0]).toMatchObject({ verdict: "confirmed", supporting: 2, contradicting: 1, feedbackRead: 5 })
    expect(content.limits.map((l) => l.key)).toEqual(["scope", "selfSelected", "small", "shortWindow"])
    // The texts of the quoted feedback come from the feedback, read under the session.
    const quoted = content.findings[0].quotes[0].feedbackId
    expect(report!.feedback[quoted]).toMatchObject({ text: TEXTS[1], channel: "Intervista" })

    const { data: rows } = await admin
      .from("analyses")
      .select("kind, status, analysis_runs (model, input_tokens, output_tokens, cost_usd, issues)")
      .eq("workspace_id", user.workspaceId)
      .eq("kind", "report")
    expect(rows).toEqual([
      {
        kind: "report",
        status: "done",
        analysis_runs: {
          model: "claude-sonnet-5-5",
          input_tokens: 12_000,
          output_tokens: 3_000,
          cost_usd: 0.054,
          issues: [{ part: "summary", problem: "number_outside_placeholder", detail: 3 }],
        },
      },
    ])
    const after = await getUsage(user.workspaceId, new Date())
    expect(after.analysesThisMonth).toBe(before.analysesThisMonth + 1)

    expect(analytics.trackEvent).toHaveBeenCalledWith(user.workspaceId, {
      event: "report_generated",
      properties: { feedback_count: 5, theme_count: 2, hypothesis_count: 1 },
    })
  })

  it("writes in the language of the interface", async () => {
    await synthesized()
    ui.locale = "en"
    const model = routedModel(REPORT)
    ai.model = model
    expect(await generateReport(user.researchId)).toEqual({ ok: true })
    const [call] = reportCalls(model)
    expect(JSON.stringify(call.prompt)).toContain(JSON.stringify(reportInstructions("en")).slice(1, 60))
    expect((await getLatestReport({ id: user.researchId, workspaceId: user.workspaceId }))!.locale).toBe("en")
  })

  it("says the Research changed after the report: new feedback, a newer synthesis", async () => {
    await synthesized()
    ai.model = routedModel(REPORT)
    await generateReport(user.researchId)
    await addFeedback(["Un feedback arrivato dopo il report."])
    const research = { id: user.researchId, workspaceId: user.workspaceId }
    expect((await getLatestReport(research))!.newFeedback).toBe(1)
    expect((await getLatestReport(research))!.newerSynthesisAt).toBeNull()
    ai.model = routedModel(null)
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true })
    expect((await getLatestReport(research))!.newerSynthesisAt).not.toBeNull()
  })

  it("leaves out of the report a quoted feedback deleted after it", async () => {
    await synthesized()
    ai.model = routedModel(REPORT)
    await generateReport(user.researchId)
    const research = { id: user.researchId, workspaceId: user.workspaceId }
    const quoted = (await getLatestReport(research))!.content.findings[0].quotes[0].feedbackId
    await admin.from("feedback").delete().eq("id", quoted)
    expect((await getLatestReport(research))!.feedback[quoted]).toBeUndefined()
  })

  it("needs a synthesis: nothing is reserved and the model is not called", async () => {
    await addFeedback()
    const model = routedModel(REPORT)
    ai.model = model
    expect(await generateReport(user.researchId)).toEqual({ ok: false, reason: "no_synthesis" })
    expect(model.doGenerateCalls).toHaveLength(0)
    const { count } = await admin.from("analyses").select("id", { count: "exact", head: true }).eq("workspace_id", user.workspaceId)
    expect(count).toBe(0)
  })

  it("is refused at the monthly limit, like an analysis, before calling the model", async () => {
    await synthesized()
    // Free: 3 analyses. The themes and the verdict used 2; one more makes 3.
    await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
    await admin
      .from("analyses")
      .insert({ workspace_id: user.workspaceId, research_id: user.researchId, kind: "verdict", period_start: daysAgo(0), feedback_count: 5 })
    const model = routedModel(REPORT)
    ai.model = model
    expect(await generateReport(user.researchId)).toEqual({ ok: false, reason: "limit" })
    expect(reportCalls(model)).toHaveLength(0)
  })

  it("fails without counting when the model answers badly, and saves nothing", async () => {
    await synthesized()
    const before = await getUsage(user.workspaceId, new Date())
    for (const output of ["non è JSON", { ...REPORT, findings: [{ ...REPORT.findings[0], theme: "T9" }] }]) {
      ai.model = routedModel(output)
      expect(await generateReport(user.researchId)).toEqual({ ok: false, reason: "failed" })
    }
    expect(await getLatestReport({ id: user.researchId, workspaceId: user.workspaceId })).toBeNull()
    const { data } = await admin.from("analyses").select("status").eq("workspace_id", user.workspaceId).eq("kind", "report")
    expect(data).toEqual([{ status: "failed" }, { status: "failed" }])
    expect((await getUsage(user.workspaceId, new Date())).analysesThisMonth).toBe(before.analysesThisMonth)
    expect(analytics.trackEvent).not.toHaveBeenCalledWith(user.workspaceId, expect.objectContaining({ event: "report_generated" }))
  })

  it("does not find another workspace's Research, and sends it to no model", async () => {
    await synthesized()
    session.client = other.client
    const model = routedModel(REPORT)
    ai.model = model
    expect(await generateReport(user.researchId)).toEqual({ ok: false, reason: "not_found" })
    expect(model.doGenerateCalls).toHaveLength(0)
    expect(await getLatestReport({ id: user.researchId, workspaceId: user.workspaceId })).toBeNull()
  })

  it("asks to sign in again without a session", async () => {
    session.client = { auth: { getClaims: async () => ({ data: null }) } }
    expect(await generateReport(user.researchId)).toEqual({ ok: false, reason: "session" })
  })
})
