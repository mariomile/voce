import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The hypothesis actions write for real against the local database, as fresh test users.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))

const { addHypothesis, updateHypothesis, deleteHypothesis } = await import("./actions")

let user: TestUser
let other: TestUser

beforeAll(async () => {
  ;[user, other] = await Promise.all([createTestUser("hypotheses"), createTestUser("hypotheses-other")])
})

afterAll(() => deleteTestUsers([user, other]))

beforeEach(async () => {
  session.client = user.client
  await admin.from("research_hypotheses").delete().eq("workspace_id", user.workspaceId)
})

async function texts(researchId = user.researchId) {
  const { data } = await admin.from("research_hypotheses").select("text").eq("research_id", researchId).order("position")
  return data!.map((h) => h.text)
}

async function seed(count: number) {
  for (let i = 1; i <= count; i++) {
    const { error } = await admin
      .from("research_hypotheses")
      .insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: `Ipotesi ${i}` })
    if (error) throw error
  }
}

describe("addHypothesis", () => {
  it("saves the trimmed text at the end of the Research", async () => {
    await seed(1)
    const result = await addHypothesis(user.researchId, "  I team piccoli non passano a Pro per il prezzo.  ")
    expect(result).toMatchObject({ ok: true })
    expect(await texts()).toEqual(["Ipotesi 1", "I team piccoli non passano a Pro per il prezzo."])
  })

  it("empty and 201-character hypotheses are invalid or too_long and create nothing", async () => {
    expect(await addHypothesis(user.researchId, "")).toEqual({ ok: false, reason: "invalid" })
    expect(await addHypothesis(user.researchId, " \n\t ")).toEqual({ ok: false, reason: "invalid" })
    // @ts-expect-error not a string on purpose
    expect(await addHypothesis(user.researchId, null)).toEqual({ ok: false, reason: "invalid" })
    expect(await addHypothesis(user.researchId, "a".repeat(201))).toEqual({ ok: false, reason: "too_long" })
    // Characters, not UTF-16 units: 200 emoji fit.
    expect(await addHypothesis(user.researchId, "🙂".repeat(200))).toMatchObject({ ok: true })
    expect(await texts()).toEqual(["🙂".repeat(200)])
  })

  it("a sixth hypothesis is max_reached", async () => {
    await seed(5)
    expect(await addHypothesis(user.researchId, "La sesta")).toEqual({ ok: false, reason: "max_reached" })
    expect(await texts()).toHaveLength(5)
  })

  it("two concurrent adds on 4 hypotheses: one saves, the other is max_reached", async () => {
    await seed(4)
    const results = await Promise.all([
      addHypothesis(user.researchId, "Dalla prima scheda"),
      addHypothesis(user.researchId, "Dalla seconda scheda"),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: "max_reached" }])
    expect(await texts()).toHaveLength(5)
  })

  it("without a session returns session and creates nothing", async () => {
    session.client = anon()
    expect(await addHypothesis(user.researchId, "Senza sessione")).toEqual({ ok: false, reason: "session" })
    expect(await texts()).toEqual([])
  })

  it("a Research of another workspace is failed and gets nothing", async () => {
    expect(await addHypothesis(other.researchId, "Intrusa")).toEqual({ ok: false, reason: "failed" })
    expect(await addHypothesis("not-a-uuid", "Intrusa")).toEqual({ ok: false, reason: "failed" })
    expect(await texts(other.researchId)).toEqual([])
  })
})

async function onlyHypothesis() {
  const { data } = await admin
    .from("research_hypotheses")
    .select("id, text, written_at")
    .eq("research_id", user.researchId)
    .single()
  return data!
}

describe("updateHypothesis", () => {
  it("changes the text", async () => {
    await seed(1)
    const { id } = await onlyHypothesis()
    expect(await updateHypothesis(id, "  Testo nuovo  ")).toEqual({ ok: true })
    expect(await texts()).toEqual(["Testo nuovo"])
  })

  it("empty and 201-character texts are invalid or too_long and change nothing", async () => {
    await seed(1)
    const { id } = await onlyHypothesis()
    expect(await updateHypothesis(id, "  ")).toEqual({ ok: false, reason: "invalid" })
    expect(await updateHypothesis(id, "a".repeat(201))).toEqual({ ok: false, reason: "too_long" })
    expect(await texts()).toEqual(["Ipotesi 1"])
  })

  it("without a session returns session and changes nothing", async () => {
    await seed(1)
    const { id } = await onlyHypothesis()
    session.client = anon()
    expect(await updateHypothesis(id, "Senza sessione")).toEqual({ ok: false, reason: "session" })
    expect(await texts()).toEqual(["Ipotesi 1"])
  })

  it("a hypothesis of another workspace is failed and unchanged", async () => {
    await seed(1)
    const { id } = await onlyHypothesis()
    session.client = other.client
    expect(await updateHypothesis(id, "Presa")).toEqual({ ok: false, reason: "failed" })
    expect(await texts()).toEqual(["Ipotesi 1"])
  })
})

describe("deleteHypothesis", () => {
  it("deletes the hypothesis", async () => {
    await seed(2)
    const { data } = await admin.from("research_hypotheses").select("id").eq("text", "Ipotesi 1").eq("research_id", user.researchId).single()
    expect(await deleteHypothesis(data!.id)).toEqual({ ok: true })
    expect(await texts()).toEqual(["Ipotesi 2"])
  })

  it("without a session returns session; another workspace's is failed; nothing is deleted", async () => {
    await seed(1)
    const { id } = await onlyHypothesis()
    session.client = anon()
    expect(await deleteHypothesis(id)).toEqual({ ok: false, reason: "session" })
    session.client = other.client
    expect(await deleteHypothesis(id)).toEqual({ ok: false, reason: "failed" })
    expect(await deleteHypothesis("not-a-uuid")).toEqual({ ok: false, reason: "failed" })
    expect(await texts()).toEqual(["Ipotesi 1"])
  })
})
