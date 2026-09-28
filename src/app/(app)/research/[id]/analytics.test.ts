import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { RawOutput } from "@/lib/analysis"
import { fakeModel, fakeSynthesisModel } from "@/test/fake-model"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// first_research_collected, research_synthesized and first_analysis_completed with the real trackMilestone,
// trackEvent and database: only PostHog and the model are fake.
// after() runs the callback at once, and the test waits for it.
const session = vi.hoisted(() => ({ client: null as unknown }))
const pending = vi.hoisted(() => ({ tasks: [] as Promise<unknown>[] }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
vi.mock("next/server", () => ({ after: (task: () => Promise<unknown>) => pending.tasks.push(task()) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": crypto.randomUUID() }) }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))

const { addNotes, importCsv } = await import("./collect/actions")
const { synthesize } = await import("./actions")
const { submitFeedback } = await import("@/app/actions")

const realFetch = globalThis.fetch
const posthog = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }))
vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) =>
  String(input).startsWith("https://eu.i.posthog.com/") ? posthog(input, init) : realFetch(input, init)
)

const MARKER = "ZZMARCATOREZZ"

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("research-analytics")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  vi.stubEnv("POSTHOG_KEY", "phc_test")
  posthog.mockClear()
  pending.tasks = []
  session.client = user.client
  // Hypotheses first: their verdicts point to the analyses.
  await admin.from("research_hypotheses").delete().eq("workspace_id", user.workspaceId)
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  await admin.from("analyses").delete().eq("workspace_id", user.workspaceId)
  await admin.from("analytics_milestones").delete().eq("workspace_id", user.workspaceId)
})

async function settle() {
  await Promise.all(pending.tasks)
}

const sentEvents = (event: string) =>
  posthog.mock.calls
    .map(([, init]) => JSON.parse((init as RequestInit).body as string))
    .filter((body) => body.event === event)
const collected = () => sentEvents("first_research_collected")

async function fill(researchId: string, count: number) {
  const rows = Array.from({ length: count }, (_, i) => ({
    workspace_id: user.workspaceId,
    research_id: researchId,
    text: `Già qui ${MARKER} ${i}`,
    channel: "Supporto",
  }))
  const { error } = await admin.from("feedback").insert(rows)
  if (error) throw error
}

const csv = (text: string) => {
  const data = new FormData()
  data.set("file", new File([text], "feedback.csv", { type: "text/csv" }))
  return data
}

const notes = { text: `Note ${MARKER}`, channel: "", customer: `Persona ${MARKER}`, receivedAt: "" }

describe("first_research_collected", () => {
  it("the feedback that brings a Research to 5 sends it once, from the notes", async () => {
    await fill(user.researchId, 3)
    expect(await addNotes(user.researchId, notes)).toEqual({ ok: true })
    await settle()
    expect(collected()).toEqual([])
    expect(await addNotes(user.researchId, notes)).toEqual({ ok: true })
    await settle()
    expect(collected()).toEqual([
      {
        api_key: "phc_test",
        event: "first_research_collected",
        distinct_id: user.workspaceId,
        timestamp: expect.any(String),
        properties: { $process_person_profile: false, $geoip_disable: true },
      },
    ])
  })

  it("the feedback that brings a Research to 5 sends it once, from the public form", async () => {
    await fill(user.researchId, 4)
    const result = await submitFeedback({ slug: user.formSlug, text: `Dal modulo ${MARKER}`, email: "", website: "" })
    expect(result).toEqual({ ok: true })
    await settle()
    expect(collected()).toHaveLength(1)
    expect(collected()[0].distinct_id).toBe(user.workspaceId)
  })

  it("the feedback that brings a Research to 5 sends it once, from the CSV", async () => {
    await fill(user.researchId, 3)
    expect(await importCsv(user.researchId, csv(`testo\nUno ${MARKER}\nDue ${MARKER}`))).toMatchObject({ imported: 2 })
    await settle()
    expect(collected()).toHaveLength(1)
  })

  it("the sixth and a second Research's fifth send nothing", async () => {
    const second = await user.client.rpc("create_research", { ws: user.workspaceId, question: `Seconda ${MARKER}?` })
    try {
      await fill(user.researchId, 4)
      await addNotes(user.researchId, notes)
      await addNotes(user.researchId, notes)
      await fill(second.data!, 4)
      await addNotes(second.data!, notes)
      await settle()
      expect(collected()).toHaveLength(1)
    } finally {
      await admin.from("research").delete().eq("id", second.data!)
    }
  })

  it("five feedback spread over two Research send nothing", async () => {
    const second = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Seconda?" })
    try {
      await fill(second.data!, 3)
      await addNotes(user.researchId, notes)
      await addNotes(user.researchId, notes)
      await settle()
      expect(collected()).toEqual([])
    } finally {
      await admin.from("research").delete().eq("id", second.data!)
    }
  })

  it("no question or feedback text reaches PostHog", async () => {
    await fill(user.researchId, 4)
    await addNotes(user.researchId, notes)
    await settle()
    expect(collected()).toHaveLength(1)
    expect(JSON.stringify(posthog.mock.calls)).not.toContain(MARKER)
  })

  it("without POSTHOG_KEY nothing is sent and nothing is claimed", async () => {
    vi.stubEnv("POSTHOG_KEY", "")
    await fill(user.researchId, 4)
    await addNotes(user.researchId, notes)
    await settle()
    expect(posthog).not.toHaveBeenCalled()
    const { count } = await admin
      .from("analytics_milestones")
      .select("event", { count: "exact", head: true })
      .eq("workspace_id", user.workspaceId)
    expect(count).toBe(0)
  })
})

// Five feedback in the Research; the model finds two themes with three verified quotes and one made up.
const themes: RawOutput = {
  themes: [
    {
      title: `La banca si scollega ${MARKER}`,
      summary: `Sintesi ${MARKER}`,
      kind: "problem",
      sentiment: "negative",
      feedback: [1, 2],
      quotes: [
        { feedback: 1, text: "Feedback 1" },
        { feedback: 2, text: "Feedback 2" },
      ],
    },
    {
      title: "Fatture dal telefono",
      summary: "Piace.",
      kind: "praise",
      sentiment: "positive",
      feedback: [3, 4],
      quotes: [
        { feedback: 3, text: "Feedback 3" },
        { feedback: 4, text: "inventata" },
      ],
    },
  ],
}

async function fiveFeedback(researchId = user.researchId) {
  const rows = [1, 2, 3, 4, 5].map((n) => ({
    workspace_id: user.workspaceId,
    research_id: researchId,
    text: `Feedback ${n} ${MARKER}`,
    channel: "Supporto",
  }))
  const { error } = await admin.from("feedback").insert(rows)
  if (error) throw error
}

describe("research_synthesized", () => {
  it("one per synthesize with a done part, with exactly its properties", async () => {
    await fiveFeedback()
    ai.model = fakeModel(themes)
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true })
    await settle()
    expect(sentEvents("research_synthesized")).toEqual([
      {
        api_key: "phc_test",
        event: "research_synthesized",
        distinct_id: user.workspaceId,
        timestamp: expect.any(String),
        // What the model read, the verified quotes saved, no hypothesis with a verdict in this part.
        properties: {
          feedback_count: 5,
          citation_count: 3,
          hypothesis_count: 0,
          $process_person_profile: false,
          $geoip_disable: true,
        },
      },
    ])
  })

  it("none when the themes part fails or finds no theme, nor when nothing ran", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    await fiveFeedback()
    ai.model = fakeModel("non è JSON")
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "failed" })
    ai.model = fakeModel({ themes: [] })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "no_themes" })
    await admin.from("analyses").insert({ workspace_id: user.workspaceId, research_id: user.researchId, period_start: "2026-09-01", feedback_count: 1, status: "running" })
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "busy" })
    log.mockRestore()
    await settle()
    expect(sentEvents("research_synthesized")).toEqual([])
  })

  it("no question, feedback or theme text reaches PostHog", async () => {
    await fiveFeedback()
    ai.model = fakeModel(themes)
    await synthesize(user.researchId)
    await settle()
    expect(posthog).toHaveBeenCalled()
    expect(JSON.stringify(posthog.mock.calls)).not.toContain(MARKER)
  })
})

// Two hypotheses, each with a verdict: 2 verified quotes and one made up.
const verdicts = {
  hypotheses: [
    {
      hypothesis: 1,
      verdict: "confirmed",
      reasoning: `Ragionamento ${MARKER}`,
      supporting: [1, 2],
      contradicting: [],
      quotes: [
        { feedback: 1, stance: "for", text: "Feedback 1" },
        { feedback: 2, stance: "for", text: "inventata" },
      ],
    },
    {
      hypothesis: 2,
      verdict: "refuted",
      reasoning: "No.",
      supporting: [],
      contradicting: [5],
      quotes: [{ feedback: 5, stance: "against", text: "Feedback 5" }],
    },
  ],
}

async function twoHypotheses() {
  const { error } = await admin.from("research_hypotheses").insert([
    { workspace_id: user.workspaceId, research_id: user.researchId, text: `Ipotesi uno ${MARKER}` },
    { workspace_id: user.workspaceId, research_id: user.researchId, text: "Ipotesi due" },
  ])
  if (error) throw error
}

describe("research_synthesized with the verdict", () => {
  it("citation_count adds the verdict quotes saved, hypothesis_count the hypotheses with a saved verdict", async () => {
    await fiveFeedback()
    await twoHypotheses()
    ai.model = fakeSynthesisModel(themes, verdicts)
    expect(await synthesize(user.researchId)).toMatchObject({ ok: true, themes: "done", verdict: "done" })
    await settle()
    expect(sentEvents("research_synthesized")).toEqual([
      expect.objectContaining({
        properties: {
          feedback_count: 5,
          citation_count: 5,
          hypothesis_count: 2,
          $process_person_profile: false,
          $geoip_disable: true,
        },
      }),
    ])
  })

  it("a failed verdict counts no hypothesis and none of its quotes", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    await fiveFeedback()
    await twoHypotheses()
    ai.model = fakeSynthesisModel(themes, new Error("down"))
    await synthesize(user.researchId)
    log.mockRestore()
    await settle()
    expect(sentEvents("research_synthesized")).toEqual([
      expect.objectContaining({ properties: expect.objectContaining({ citation_count: 3, hypothesis_count: 0 }) }),
    ])
  })

  it("themes failed and verdict done: one research_synthesized, no first_analysis_completed", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    await fiveFeedback()
    await twoHypotheses()
    ai.model = fakeSynthesisModel(new Error("down"), verdicts)
    await synthesize(user.researchId)
    log.mockRestore()
    await settle()
    expect(sentEvents("research_synthesized")).toEqual([
      expect.objectContaining({ properties: expect.objectContaining({ citation_count: 2, hypothesis_count: 2 }) }),
    ])
    expect(sentEvents("first_analysis_completed")).toEqual([])
  })

  it("none when both parts fail", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    await fiveFeedback()
    await twoHypotheses()
    ai.model = fakeSynthesisModel(new Error("down"), new Error("down"))
    expect(await synthesize(user.researchId)).toEqual({ ok: false, reason: "failed" })
    log.mockRestore()
    await settle()
    expect(sentEvents("research_synthesized")).toEqual([])
  })

  it("no question, hypothesis, feedback or reasoning text reaches PostHog", async () => {
    await fiveFeedback()
    await twoHypotheses()
    ai.model = fakeSynthesisModel(themes, verdicts)
    await synthesize(user.researchId)
    await settle()
    expect(posthog).toHaveBeenCalled()
    expect(JSON.stringify(posthog.mock.calls)).not.toContain(MARKER)
  })
})

describe("first_analysis_completed", () => {
  it("the first themes analysis with a theme in any Research sends it once", async () => {
    const second = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Seconda?" })
    try {
      await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
      await fiveFeedback()
      await fiveFeedback(second.data!)
      ai.model = fakeModel(themes)
      await synthesize(user.researchId)
      await synthesize(second.data!)
      await synthesize(user.researchId)
      await settle()
      expect(sentEvents("first_analysis_completed")).toEqual([
        expect.objectContaining({
          distinct_id: user.workspaceId,
          properties: { feedback_count: 5, theme_count: 2, $process_person_profile: false, $geoip_disable: true },
        }),
      ])
      expect(sentEvents("research_synthesized")).toHaveLength(3)
    } finally {
      await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
      await admin.from("research").delete().eq("id", second.data!)
    }
  })
})
