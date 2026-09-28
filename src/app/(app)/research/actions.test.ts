import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// createResearch writes for real, as a fresh test user.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))

const { createResearch } = await import("./actions")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("research")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(() => {
  session.client = user.client
})

async function questions() {
  const { data } = await admin.from("research").select("question").eq("workspace_id", user.workspaceId).order("created_at")
  return data!.map((r) => r.question)
}

describe("createResearch", () => {
  it("empty, blank and 201-character questions return invalid or too_long and create nothing", async () => {
    expect(await createResearch("")).toEqual({ ok: false, reason: "invalid" })
    expect(await createResearch(" \n\t ")).toEqual({ ok: false, reason: "invalid" })
    expect(await createResearch("a".repeat(201))).toEqual({ ok: false, reason: "too_long" })
    // @ts-expect-error not a string on purpose
    expect(await createResearch(null)).toEqual({ ok: false, reason: "invalid" })
    expect(await questions()).toEqual(["Domanda di prova?"])
  })

  it("a valid question creates the Research and gives its id, where the browser goes", async () => {
    const question = `  ${"a".repeat(199)}?  `
    const result = await createResearch(question)
    const { data } = await admin
      .from("research")
      .select("id, question, form_enabled, form_question")
      .eq("workspace_id", user.workspaceId)
      .eq("question", `${"a".repeat(199)}?`)
      .single()
    expect(data).toMatchObject({ form_enabled: true, form_question: null })
    expect(result).toEqual({ ok: true, id: data!.id })
  })

  it("drops NUL characters instead of crashing", async () => {
    expect(await createResearch("Con\u0000 NUL?")).toMatchObject({ ok: true })
    expect(await questions()).toContain("Con NUL?")
  })

  it("without a session returns session and creates nothing", async () => {
    const { anon } = await import("@/test/supabase")
    session.client = anon()
    const before = await questions()
    expect(await createResearch("Senza sessione?")).toEqual({ ok: false, reason: "session" })
    expect(await questions()).toEqual(before)
  })
})
