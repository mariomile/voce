import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// Actions write for real: they run on a fresh test user, so the seed stays as it is.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))

const { submitFeedback, updateTheme } = await import("./actions")

let user: TestUser
let other: TestUser
let themeId: string
let otherThemeId: string

async function addTheme(u: TestUser) {
  const { data: analysis } = await admin
    .from("analyses")
    .insert({ workspace_id: u.workspaceId, period_start: "2026-07-01", feedback_count: 0 })
    .select("id")
    .single()
  const { data: theme } = await admin
    .from("themes")
    .insert({ workspace_id: u.workspaceId, analysis_id: analysis!.id, kind: "problem", title: "Tema", summary: "Sintesi" })
    .select("id")
    .single()
  return theme!.id
}

beforeAll(async () => {
  ;[user, other] = await Promise.all([createTestUser("actions"), createTestUser("other")])
  ;[themeId, otherThemeId] = await Promise.all([addTheme(user), addTheme(other)])
})

afterAll(() => deleteTestUsers([user, other]))

describe("submitFeedback", () => {
  const valid = () => ({ slug: user.formSlug, text: "La banca si scollega.", email: "", website: "" })

  beforeAll(() => {
    session.client = anon()
  })

  it("saves a valid feedback, with or without email, as Modulo pubblico", async () => {
    expect(await submitFeedback(valid())).toEqual({ ok: true })
    expect(await submitFeedback({ ...valid(), email: "giulia@esempio.it" })).toEqual({ ok: true })
    const { data } = await admin.from("feedback").select("channel, email").eq("workspace_id", user.workspaceId).order("created_at")
    expect(data).toEqual([
      { channel: "Modulo pubblico", email: null },
      { channel: "Modulo pubblico", email: "giulia@esempio.it" },
    ])
  })

  it("rejects empty, blank and too long texts", async () => {
    for (const text of ["", "   ", "a".repeat(2001)])
      expect(await submitFeedback({ ...valid(), text })).toEqual({ ok: false, reason: "invalid" })
    expect(await submitFeedback({ ...valid(), text: "a".repeat(2000) })).toEqual({ ok: true })
  })

  it("rejects a malformed email", async () => {
    expect(await submitFeedback({ ...valid(), email: "giulia@" })).toEqual({ ok: false, reason: "invalid_email" })
  })

  it("is unavailable for full, disabled and unknown forms", async () => {
    for (const slug of ["ordinalo-7fq2", "spento-a1b2", "nope"])
      expect(await submitFeedback({ ...valid(), slug })).toEqual({ ok: false, reason: "unavailable" })
  })

  it("rejects a malformed payload without crashing", async () => {
    // @ts-expect-error not an object on purpose
    expect(await submitFeedback(null)).toEqual({ ok: false, reason: "invalid" })
  })

  it("pretends success when the honeypot is filled, and saves nothing", async () => {
    const before = await admin.from("feedback").select("*", { count: "exact", head: true }).eq("workspace_id", user.workspaceId)
    expect(await submitFeedback({ ...valid(), text: "Spam", website: "http://spam" })).toEqual({ ok: true })
    const after = await admin.from("feedback").select("*", { count: "exact", head: true }).eq("workspace_id", user.workspaceId)
    expect(after.count).toBe(before.count)
  })
})

describe("updateTheme", () => {
  beforeAll(() => {
    session.client = user.client
  })

  it("saves priority and status on a theme of the current workspace", async () => {
    expect(await updateTheme({ themeId, priority: "high", status: "roadmap" })).toEqual({ ok: true })
    const { data } = await admin.from("themes").select("priority, status").eq("id", themeId).single()
    expect(data).toEqual({ priority: "high", status: "roadmap" })
    expect(await updateTheme({ themeId, priority: null, status: "discarded" })).toEqual({ ok: true })
    const { data: after } = await admin.from("themes").select("priority, status").eq("id", themeId).single()
    expect(after).toEqual({ priority: null, status: "discarded" })
  })

  it("rejects unknown values, unknown themes and themes of another workspace", async () => {
    // @ts-expect-error invalid status on purpose
    expect(await updateTheme({ themeId, priority: null, status: "shipped" })).toEqual({ ok: false })
    expect(await updateTheme({ themeId: "th_missing", priority: null, status: "done" })).toEqual({ ok: false })
    expect(await updateTheme({ themeId: crypto.randomUUID(), priority: null, status: "done" })).toEqual({ ok: false })
    expect(await updateTheme({ themeId: otherThemeId, priority: "high", status: "done" })).toEqual({ ok: false })
    const { data } = await admin.from("themes").select("priority, status").eq("id", otherThemeId).single()
    expect(data).toEqual({ priority: null, status: "to_review" })
  })
})
