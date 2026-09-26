import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// Two fresh accounts, each with an analysis: A deletes, B's data must not move.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))

const { deleteFeedback } = await import("./actions")
const { getDashboard, getTheme } = await import("@/lib/data")

let a: TestUser
let b: TestUser

// Three feedback. Theme "Banca" links all three (the first two as quotes), theme "Offensivo" only the third.
async function seed(user: TestUser) {
  const { data: feedback } = await admin
    .from("feedback")
    .insert(
      ["La banca si scollega.", "Ricollego la banca ogni lunedì.", "Risposta inappropriata"].map((text) => ({
        workspace_id: user.workspaceId,
        text,
        channel: "Modulo pubblico",
      }))
    )
    .select("id, text")
  const [first, second, third] = ["La banca", "Ricollego", "Risposta"].map(
    (start) => feedback!.find((f) => f.text.startsWith(start))!.id
  )
  const { data: analysis } = await admin
    .from("analyses")
    .insert({ workspace_id: user.workspaceId, period_start: "2026-07-01", feedback_count: 3 })
    .select("id")
    .single()
  const { data: themes } = await admin
    .from("themes")
    .insert(
      ["Banca", "Offensivo"].map((title) => ({
        workspace_id: user.workspaceId,
        analysis_id: analysis!.id,
        kind: "problem" as const,
        title,
        summary: "Sintesi",
        sentiment: "negative" as const,
      }))
    )
    .select("id, title")
  const bank = themes!.find((t) => t.title === "Banca")!.id
  const other = themes!.find((t) => t.title === "Offensivo")!.id
  await admin.from("theme_feedback").insert([
    { workspace_id: user.workspaceId, theme_id: bank, feedback_id: first, quote_rank: 1, highlight: "si scollega" },
    { workspace_id: user.workspaceId, theme_id: bank, feedback_id: second, quote_rank: 2, highlight: "ogni lunedì" },
    { workspace_id: user.workspaceId, theme_id: bank, feedback_id: third },
    { workspace_id: user.workspaceId, theme_id: other, feedback_id: third, quote_rank: 1, highlight: "Risposta" },
  ])
  return { first, second, third, bank }
}

let aIds: Awaited<ReturnType<typeof seed>>
let bIds: Awaited<ReturnType<typeof seed>>

beforeAll(async () => {
  ;[a, b] = await Promise.all([createTestUser("delete-a"), createTestUser("delete-b")])
  ;[aIds, bIds] = await Promise.all([seed(a), seed(b)])
})

afterAll(() => deleteTestUsers([a, b]))

const feedbackCount = async (workspaceId: string) =>
  (await admin.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId)).count

describe("deleteFeedback", () => {
  it("cannot delete a feedback of another workspace, nor anything that is not an id", async () => {
    session.client = a.client
    expect(await deleteFeedback(bIds.first)).toEqual({ ok: false })
    expect(await deleteFeedback("not-an-id")).toEqual({ ok: false })
    expect(await feedbackCount(b.workspaceId)).toBe(3)
  })

  it("removes the feedback from themes, quotes and counts at once", async () => {
    session.client = a.client
    expect(await deleteFeedback(aIds.first)).toEqual({ ok: true })
    expect(await feedbackCount(a.workspaceId)).toBe(2)

    const { themes } = await getDashboard(a.workspaceId, { status: "all" })
    const bank = themes.find((t) => t.title === "Banca")!
    expect(bank.feedbackCount).toBe(2)
    expect(bank.quotes.map((q) => q.feedbackId)).toEqual([aIds.second])

    const detail = await getTheme(a.workspaceId, aIds.bank)
    expect(detail!.feedbackCount).toBe(2)
    expect(detail!.feedback.map((f) => f.feedbackId).sort()).toEqual([aIds.second, aIds.third].sort())
  })

  it("hides a theme once all its feedback are deleted", async () => {
    session.client = a.client
    expect(await deleteFeedback(aIds.third)).toEqual({ ok: true })
    const { themes, analysisThemeCount } = await getDashboard(a.workspaceId, { status: "all" })
    expect(themes.map((t) => [t.title, t.feedbackCount])).toEqual([["Banca", 1]])
    expect(analysisThemeCount).toBe(1)
  })

  it("left the other workspace as it was", async () => {
    session.client = b.client
    expect(await feedbackCount(b.workspaceId)).toBe(3)
    const { themes } = await getDashboard(b.workspaceId, { status: "all" })
    expect(themes.map((t) => [t.title, t.feedbackCount])).toEqual([
      ["Banca", 3],
      ["Offensivo", 1],
    ])
  })
})
