import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// first_research_collected with the real trackMilestone and the real database: only PostHog is fake.
// after() runs the callback at once, and the test waits for it.
const session = vi.hoisted(() => ({ client: null as unknown }))
const pending = vi.hoisted(() => ({ tasks: [] as Promise<unknown>[] }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
vi.mock("next/server", () => ({ after: (task: () => Promise<unknown>) => pending.tasks.push(task()) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": crypto.randomUUID() }) }))

const { addNotes, importCsv } = await import("./collect/actions")
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
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  await admin.from("analytics_milestones").delete().eq("workspace_id", user.workspaceId)
})

async function settle() {
  await Promise.all(pending.tasks)
}

const collected = () =>
  posthog.mock.calls
    .map(([, init]) => JSON.parse((init as RequestInit).body as string))
    .filter((body) => body.event === "first_research_collected")

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
