import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// Actions write for real: they run on a fresh test user, so the seed stays as it is.
const session = vi.hoisted(() => ({ client: null as unknown, ip: "" }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
// The visitor IP the server sees. A new one per test: the per-IP limit is shared by every test file.
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": session.ip }) }))

const { submitFeedback, updateTheme } = await import("./actions")

let user: TestUser
let other: TestUser
let themeId: string
let otherThemeId: string

async function addTheme(u: TestUser) {
  const { data: analysis } = await admin
    .from("analyses")
    .insert({ workspace_id: u.workspaceId, research_id: u.researchId, period_start: "2026-07-01", feedback_count: 0 })
    .select("id")
    .single()
  const { data: theme } = await admin
    .from("themes")
    .insert({ workspace_id: u.workspaceId, research_id: u.researchId, analysis_id: analysis!.id, kind: "problem", title: "Tema", summary: "Sintesi", sentiment: "negative" })
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

  beforeEach(() => {
    session.ip = crypto.randomUUID()
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

  it("a public form response lands in the Research of its slug", async () => {
    const { data: second, error } = await admin
      .from("research")
      .insert({ workspace_id: user.workspaceId, question: "Seconda?", form_slug: `seconda-${crypto.randomUUID().slice(0, 8)}` })
      .select("id, form_slug")
      .single()
    if (error) throw error
    try {
      expect(await submitFeedback({ ...valid(), slug: second.form_slug, text: "Per la seconda." })).toEqual({ ok: true })
      const { data } = await admin.from("feedback").select("research_id").eq("text", "Per la seconda.")
      expect(data).toEqual([{ research_id: second.id }])
    } finally {
      await admin.from("research").delete().eq("id", second.id)
    }
  })

  it("rejects empty, blank and too long texts", async () => {
    for (const text of ["", "   ", "a".repeat(2001)])
      expect(await submitFeedback({ ...valid(), text })).toEqual({ ok: false, reason: "invalid" })
    expect(await submitFeedback({ ...valid(), text: "a".repeat(2000) })).toEqual({ ok: true })
  })

  it("drops NUL characters and rejects a slug that cannot exist", async () => {
    expect(await submitFeedback({ ...valid(), text: "Con\u0000 NUL" })).toEqual({ ok: true })
    const { data } = await admin.from("feedback").select("id").eq("workspace_id", user.workspaceId).eq("text", "Con NUL")
    expect(data).toHaveLength(1)
    expect(await submitFeedback({ ...valid(), text: "\u0000" })).toEqual({ ok: false, reason: "invalid" })
    expect(await submitFeedback({ ...valid(), slug: "x\u0000y" })).toEqual({ ok: false, reason: "invalid" })
  })

    it("rejects a malformed email", async () => {
    expect(await submitFeedback({ ...valid(), email: "giulia@" })).toEqual({ ok: false, reason: "invalid_email" })
  })

  it("is unavailable for full, disabled and unknown forms", async () => {
    for (const slug of ["ordinalo-7fq2", "spento-a1b2", "nope"])
      expect(await submitFeedback({ ...valid(), slug })).toEqual({ ok: false, reason: "unavailable" })
  })

  // A full room: every phone reaches the internet from the venue Wi-Fi or the same carrier IP.
  it("accepts a room of 230 people submitting from the same IP within a minute", async () => {
    const room = await createTestUser("room")
    try {
      // Pro, so the Free limit does not get in the way of the count.
      await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", room.workspaceId)
      const started = Date.now()
      const send = (i: number) => submitFeedback({ ...valid(), slug: room.formSlug, text: `Dalla sala ${i}` })
      const results = []
      // People submit a few at a time, not one after the other.
      for (let i = 0; i < 230; i += 23) results.push(...(await Promise.all(Array.from({ length: 23 }, (_, j) => send(i + j)))))
      expect(Date.now() - started).toBeLessThan(60_000)
      expect(results).toEqual(Array(230).fill({ ok: true }))
      const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", room.workspaceId)
      expect(count).toBe(230)
    } finally {
      await deleteTestUsers([room])
    }
  }, 60_000)

  it("accepts 300 submissions an hour from the same IP across all forms, then asks to wait", async () => {
    const [first, second] = await Promise.all([createTestUser("ip-a"), createTestUser("ip-b")])
    try {
      for (const u of [first, second]) await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", u.workspaceId)
      const send = (u: TestUser, i: number) => submitFeedback({ ...valid(), slug: u.formSlug, text: `Stesso IP ${i}` })
      for (let i = 0; i < 300; i += 30) {
        // 200 to the first form, 100 to the second: the limit counts the IP on every form.
        const target = i < 200 ? first : second
        expect(await Promise.all(Array.from({ length: 30 }, (_, j) => send(target, i + j)))).toEqual(Array(30).fill({ ok: true }))
      }
      expect(await send(second, 300)).toEqual({ ok: false, reason: "rate_limited" })
      expect(await send(first, 301)).toEqual({ ok: false, reason: "rate_limited" })
      // Another visitor is not blocked by the first one.
      session.ip = crypto.randomUUID()
      expect(await send(second, 302)).toEqual({ ok: true })
    } finally {
      await deleteTestUsers([first, second])
    }
  }, 60_000)

  it("accepts 300 submissions an hour per workspace, from any IP", async () => {
    const busy = await createTestUser("busy")
    try {
      // Pro, so the Free limit does not get in the way of the count.
      await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", busy.workspaceId)
      const send = (i: number) => {
        session.ip = crypto.randomUUID()
        return submitFeedback({ ...valid(), slug: busy.formSlug, text: `Feedback ${i}` })
      }
      for (let i = 0; i < 300; i += 30)
        expect(await Promise.all(Array.from({ length: 30 }, (_, j) => send(i + j)))).toEqual(Array(30).fill({ ok: true }))
      expect(await send(300)).toEqual({ ok: false, reason: "rate_limited" })
      const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", busy.workspaceId)
      expect(count).toBe(300)
    } finally {
      await deleteTestUsers([busy])
    }
  })

  it("keeps rejecting the 101st feedback of a Free workspace", async () => {
    const full = await createTestUser("full")
    try {
      const rows = Array.from({ length: 99 }, (_, i) => ({ workspace_id: full.workspaceId, research_id: full.researchId, text: `F ${i}`, channel: "Supporto" }))
      await admin.from("feedback").insert(rows)
      expect(await submitFeedback({ ...valid(), slug: full.formSlug, text: "Il numero 100" })).toEqual({ ok: true })
      expect(await submitFeedback({ ...valid(), slug: full.formSlug, text: "Il numero 101" })).toEqual({
        ok: false,
        reason: "unavailable",
      })
      const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", full.workspaceId)
      expect(count).toBe(100)
    } finally {
      await deleteTestUsers([full])
    }
  })

  it("stops at once when the PM turns the link off", async () => {
    await admin.from("research").update({ form_enabled: false }).eq("id", user.researchId)
    expect(await submitFeedback(valid())).toEqual({ ok: false, reason: "unavailable" })
    await admin.from("research").update({ form_enabled: true }).eq("id", user.researchId)
    expect(await submitFeedback(valid())).toEqual({ ok: true })
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
