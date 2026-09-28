import { MockLanguageModelV4 } from "ai/test"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { isoDateOf } from "@/lib/format"
import type { RawAnswer } from "@/lib/questions"
import { fakeModel } from "@/test/fake-model"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// question_answered with the real trackEvent: only PostHog and the model are fake.
// after() runs the callback at once, and the test waits for it.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
const pending = vi.hoisted(() => ({ tasks: [] as Promise<unknown>[] }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/server", () => ({ after: (task: () => Promise<unknown>) => pending.tasks.push(task()) }))
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))

const { ask } = await import("./actions")

const realFetch = globalThis.fetch
const posthog = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }))
vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) =>
  String(input).startsWith("https://eu.i.posthog.com/") ? posthog(input, init) : realFetch(input, init)
)

const MARKER = "ZZMARCATOREZZ"
const TEXT = `La banca ${MARKER} si scollega ogni lunedì.`
const answer: RawAnswer = {
  answer: `La banca si scollega, dice ${MARKER}.`,
  feedback: [1],
  quotes: [{ feedback: 1, text: `banca ${MARKER} si scollega` }],
}

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("ask-analytics")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  vi.stubEnv("POSTHOG_KEY", "phc_test")
  posthog.mockClear()
  pending.tasks = []
  session.client = user.client
  ai.model = fakeModel(answer)
  await admin.from("questions").delete().eq("workspace_id", user.workspaceId)
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  await admin.from("analytics_milestones").delete().eq("workspace_id", user.workspaceId)
  await admin
    .from("feedback")
    .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: TEXT, channel: "Supporto", received_at: isoDateOf(new Date()) })
})

async function settle() {
  await Promise.all(pending.tasks)
}

const sent = () => posthog.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string))

describe("question_answered", () => {
  it("the PostHog body carries no question, answer or feedback text", async () => {
    expect(await ask({ question: `Cosa dice ${MARKER}?` })).toMatchObject({ ok: true, outcome: "answered" })
    await settle()
    expect(posthog).toHaveBeenCalledTimes(1)
    const [body] = sent()
    expect(body).toEqual({
      api_key: "phc_test",
      event: "question_answered",
      distinct_id: user.workspaceId,
      timestamp: expect.any(String),
      properties: { citation_count: 1, outcome: "answered", $process_person_profile: false, $geoip_disable: true },
    })
    expect(JSON.stringify(posthog.mock.calls)).not.toContain(MARKER)
  })

  it("is sent every time and never claims a milestone", async () => {
    await ask({ question: "Prima domanda?" })
    ai.model = fakeModel({ answer: "Nessuno ne parla.", feedback: [], quotes: [] })
    await ask({ question: "Seconda domanda?" })
    await settle()
    expect(sent().map((b) => [b.event, b.properties.outcome, b.properties.citation_count])).toEqual([
      ["question_answered", "answered", 1],
      ["question_answered", "no_evidence", 0],
    ])
    const { count } = await admin
      .from("analytics_milestones")
      .select("event", { count: "exact", head: true })
      .eq("workspace_id", user.workspaceId)
    expect(count).toBe(0)
  })

  it("analytics_milestones still refuses question_answered", async () => {
    const { error } = await admin
      .from("analytics_milestones")
      .insert({ workspace_id: user.workspaceId, event: "question_answered" as never })
    expect(error?.code).toBe("23514")
  })

  it("no event for failed, limit, busy, invalid, session, no_feedback", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    ai.model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("Anthropic API down")
      },
    })
    expect(await ask({ question: "Fallisce?" })).toMatchObject({ reason: "failed" })
    log.mockRestore()

    expect(await ask({ question: "" })).toMatchObject({ reason: "invalid" })

    await admin.from("questions").insert({ workspace_id: user.workspaceId, status: "running", feedback_considered: 1 })
    expect(await ask({ question: "Occupato?" })).toMatchObject({ reason: "busy" })

    await admin.from("questions").delete().eq("workspace_id", user.workspaceId)
    await admin.from("questions").insert(
      Array.from({ length: 10 }, () => ({ workspace_id: user.workspaceId, status: "failed" as const, feedback_considered: 1 }))
    )
    expect(await ask({ question: "Limite?" })).toMatchObject({ reason: "limit" })

    session.client = anon()
    expect(await ask({ question: "Sessione?" })).toMatchObject({ reason: "session" })
    session.client = user.client

    await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
    expect(await ask({ question: "Nessun feedback?" })).toMatchObject({ reason: "no_feedback" })

    await settle()
    expect(posthog).not.toHaveBeenCalled()
  })

  it("without POSTHOG_KEY no question sends anything", async () => {
    vi.stubEnv("POSTHOG_KEY", "")
    expect(await ask({ question: "Senza chiave?" })).toMatchObject({ ok: true })
    await settle()
    expect(pending.tasks).toHaveLength(0)
    expect(posthog).not.toHaveBeenCalled()
  })
})
