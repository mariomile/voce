import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fakeModel, themesOutput } from "@/test/fake-model"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The room screen reads as the signed-in user, against the local database. The model is always fake.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
vi.mock("@/lib/analytics", () => ({ trackMilestone: vi.fn(), trackEvent: vi.fn() }))
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))

const { roomThemes } = await import("./actions")
const { GET } = await import("./status/route")
const { synthesize } = await import("@/app/(app)/research/[id]/actions")
const { getRoomStatus } = await import("@/lib/data")

let owner: TestUser
let other: TestUser

beforeAll(async () => {
  owner = await createTestUser("room")
  other = await createTestUser("room-other")
})

afterAll(() => deleteTestUsers([owner, other]))

beforeEach(async () => {
  session.client = owner.client
  await admin.from("analyses").delete().eq("workspace_id", owner.workspaceId)
  await admin.from("feedback").delete().eq("workspace_id", owner.workspaceId)
  await admin.from("research").update({ form_enabled: true }).eq("id", owner.researchId)
})

async function addFeedback(texts: string[], channel: string) {
  const { error } = await admin
    .from("feedback")
    .insert(texts.map((text) => ({ workspace_id: owner.workspaceId, research_id: owner.researchId, text, channel })))
  if (error) throw error
}

// Polled by the screen while an analysis may be running: a route handler, because server actions
// from one page run one at a time and the counter would stop for the whole analysis.
async function roomStatus(researchId = owner.researchId) {
  const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: researchId }) })
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  return response.status === 404 ? 404 : response.json()
}

describe("GET /research/[id]/sala/status", () => {
  it("counts only the responses from the public form", async () => {
    await addFeedback(["Uno", "Due"], "Modulo pubblico")
    await addFeedback(["Tre"], "Supporto")
    expect(await roomStatus()).toEqual({ responses: 2, form: "open" })
  })

  it("says when the link is off", async () => {
    await admin.from("research").update({ form_enabled: false }).eq("id", owner.researchId)
    expect(await roomStatus()).toEqual({ responses: 0, form: "off" })
  })

  it("says when the Free limit of 100 feedback is reached, counting every channel", async () => {
    await addFeedback(Array.from({ length: 99 }, (_, i) => `CSV ${i}`), "Supporto")
    await addFeedback(["Dalla sala"], "Modulo pubblico")
    expect(await roomStatus()).toEqual({ responses: 1, form: "full" })
  })
})

describe("getRoomStatus", () => {
  it("reads nothing of another workspace, even given its ids", async () => {
    await addFeedback(["Uno", "Due"], "Modulo pubblico")
    session.client = other.client
    const status = await getRoomStatus({ id: owner.researchId, workspaceId: owner.workspaceId, formEnabled: true })
    expect(status.responses).toBe(0)
  })

  it("answers 404 for a Research of another workspace or a wrong id", async () => {
    session.client = other.client
    expect(await roomStatus(owner.researchId)).toBe(404)
    expect(await roomStatus("non-un-uuid")).toBe(404)
  })
})

describe("roomThemes", () => {
  it("sends the latest themes with kind, title and count only", async () => {
    await addFeedback(["La banca si scollega.", "Devo ricollegare la banca."], "Modulo pubblico")
    ai.model = fakeModel(
      themesOutput([
        {
          title: "La banca si scollega",
          summary: "Il collegamento con la banca cade spesso.",
          kind: "problem",
          sentiment: "negative",
          feedback: [1, 2],
          quotes: [{ feedback: 1, text: "La banca si scollega." }],
        },
      ])
    )
    expect(await synthesize(owner.researchId)).toMatchObject({ ok: true, themeCount: 1 })
    const themes = await roomThemes(owner.researchId)
    expect(themes).toEqual([{ id: expect.any(String), kind: "problem", title: "La banca si scollega", feedbackCount: 2 }])
    expect(JSON.stringify(themes)).not.toContain("scollega.")
  })

  it("is empty before any analysis, and for a wrong id", async () => {
    expect(await roomThemes(owner.researchId)).toEqual([])
    expect(await roomThemes("non-un-uuid")).toEqual([])
  })

  it("never shows another workspace's themes, even given its Research", async () => {
    await addFeedback(["La banca si scollega.", "Devo ricollegare la banca."], "Modulo pubblico")
    ai.model = fakeModel(
      themesOutput([{ title: "Banca", summary: "S", kind: "problem", sentiment: "negative", feedback: [1, 2], quotes: [] }])
    )
    expect(await synthesize(owner.researchId)).toMatchObject({ ok: true })
    session.client = other.client
    expect(await roomThemes(owner.researchId)).toEqual([])
  })
})
