import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { RawOutput } from "@/lib/analysis"
import { fakeModel } from "@/test/fake-model"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The room screen reads as the signed-in user, against the local database. The model is always fake.
const session = vi.hoisted(() => ({ client: null as unknown }))
const ai = vi.hoisted(() => ({ model: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
vi.mock("@/lib/analytics", () => ({ trackMilestone: vi.fn() }))
vi.mock("@/lib/analysis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analysis")>()),
  analysisLanguageModel: () => ai.model,
}))

const { roomThemes } = await import("./actions")
const { GET } = await import("./status/route")
const { analyze } = await import("@/app/(app)/themes/actions")
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
  await admin.from("workspaces").update({ form_enabled: true }).eq("id", owner.workspaceId)
})

async function addFeedback(texts: string[], channel: string) {
  const { error } = await admin
    .from("feedback")
    .insert(texts.map((text) => ({ workspace_id: owner.workspaceId, text, channel })))
  if (error) throw error
}

// Polled by the screen while an analysis may be running: a route handler, because server actions
// from one page run one at a time and the counter would stop for the whole analysis.
async function roomStatus() {
  const response = await GET()
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  return response.json()
}

describe("GET /sala/status", () => {
  it("counts only the responses from the public form", async () => {
    await addFeedback(["Uno", "Due"], "Modulo pubblico")
    await addFeedback(["Tre"], "Supporto")
    expect(await roomStatus()).toEqual({ responses: 2, form: "open" })
  })

  it("says when the link is off", async () => {
    await admin.from("workspaces").update({ form_enabled: false }).eq("id", owner.workspaceId)
    expect(await roomStatus()).toEqual({ responses: 0, form: "off" })
  })

  it("says when the Free limit of 100 feedback is reached, counting every channel", async () => {
    await addFeedback(Array.from({ length: 99 }, (_, i) => `CSV ${i}`), "Supporto")
    await addFeedback(["Dalla sala"], "Modulo pubblico")
    expect(await roomStatus()).toEqual({ responses: 1, form: "full" })
  })
})

describe("getRoomStatus", () => {
  it("reads nothing of another workspace, even given its id", async () => {
    await addFeedback(["Uno", "Due"], "Modulo pubblico")
    session.client = other.client
    const status = await getRoomStatus({ id: owner.workspaceId, formEnabled: true })
    expect(status.responses).toBe(0)
  })
})

describe("roomThemes", () => {
  it("sends the latest themes with kind, title and count only", async () => {
    await addFeedback(["La banca si scollega.", "Devo ricollegare la banca."], "Modulo pubblico")
    ai.model = fakeModel({
      themes: [
        {
          title: "La banca si scollega",
          summary: "Il collegamento con la banca cade spesso.",
          kind: "problem",
          sentiment: "negative",
          feedback: [1, 2],
          quotes: [{ feedback: 1, text: "La banca si scollega." }],
        },
      ],
    } satisfies RawOutput)
    expect(await analyze()).toEqual({ ok: true })
    const themes = await roomThemes()
    expect(themes).toEqual([{ id: expect.any(String), kind: "problem", title: "La banca si scollega", feedbackCount: 2 }])
    expect(JSON.stringify(themes)).not.toContain("scollega.")
  })

  it("is empty before any analysis", async () => {
    expect(await roomThemes()).toEqual([])
  })

  it("never shows another workspace's themes", async () => {
    session.client = other.client
    expect(await roomThemes()).toEqual([])
  })
})
