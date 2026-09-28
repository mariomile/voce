import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { isoDateOf } from "@/lib/format"
import { admin, anon, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// Actions write for real, as a fresh test user: the seed stays as it is.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))
// Which activation events the action asks for. Sending them is tested in src/lib/analytics.test.ts.
const analytics = vi.hoisted(() => ({ trackMilestone: vi.fn() }))
vi.mock("@/lib/analytics", () => analytics)

const { addFeedback, importCsv, previewCsv, regenerateFormLink, setFormEnabled, setFormQuestion } = await import(
  "./actions"
)

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("collect")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  session.client = user.client
  await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
})

const csv = (text: string) => {
  const data = new FormData()
  data.set("file", new File([text], "feedback.csv", { type: "text/csv" }))
  return data
}

async function savedFeedback() {
  const { data } = await admin
    .from("feedback")
    .select("text, channel, customer, received_at")
    .eq("workspace_id", user.workspaceId)
    .order("created_at")
    .order("text")
  return data!
}

async function fillTo(count: number) {
  const rows = Array.from({ length: count }, (_, i) => ({ workspace_id: user.workspaceId, research_id: user.researchId, text: `Già qui ${i}`, channel: "Supporto" }))
  const { error } = await admin.from("feedback").insert(rows)
  if (error) throw error
}

describe("addFeedback", () => {
  const valid = { text: "La banca si scollega", channel: "Email", customer: "", receivedAt: "" }

  it("saves a feedback with today's date when none is given", async () => {
    expect(await addFeedback(user.researchId, valid)).toEqual({ ok: true })
    expect(await addFeedback(user.researchId, { text: "  Con cliente  ", channel: " Slack ", customer: " Rossi ", receivedAt: "2026-09-01" })).toEqual({ ok: true })
    expect(await savedFeedback()).toEqual([
      { text: "La banca si scollega", channel: "Email", customer: null, received_at: isoDateOf(new Date()) },
      { text: "Con cliente", channel: "Slack", customer: "Rossi", received_at: "2026-09-01" },
    ])
  })

  it("rejects empty or too long text, missing channel, future or broken dates", async () => {
    expect(await addFeedback(user.researchId, { ...valid, text: "   " })).toEqual({ ok: false, reason: "invalid", fields: ["text"] })
    expect(await addFeedback(user.researchId, { ...valid, text: "a".repeat(2001) })).toEqual({ ok: false, reason: "invalid", fields: ["text"] })
    expect(await addFeedback(user.researchId, { ...valid, channel: "" })).toEqual({ ok: false, reason: "invalid", fields: ["channel"] })
    expect(await addFeedback(user.researchId, { ...valid, customer: "c".repeat(201) })).toEqual({ ok: false, reason: "invalid", fields: ["customer"] })
    expect(await addFeedback(user.researchId, { ...valid, receivedAt: "2999-01-01" })).toEqual({ ok: false, reason: "invalid", fields: ["receivedAt"] })
    expect(await addFeedback(user.researchId, { ...valid, receivedAt: "31/12/2026" })).toEqual({ ok: false, reason: "invalid", fields: ["receivedAt"] })
    // @ts-expect-error not an object on purpose
    expect(await addFeedback(user.researchId, null)).toMatchObject({ ok: false, reason: "invalid" })
    expect(await addFeedback(user.researchId, { ...valid, text: "a".repeat(2000) })).toEqual({ ok: true })
    expect(await savedFeedback()).toHaveLength(1)
  })

  it("drops NUL characters instead of crashing", async () => {
    expect(await addFeedback(user.researchId, { ...valid, text: "Ci\u0000ao", customer: "Ro\u0000ssi" })).toEqual({ ok: true })
    expect(await savedFeedback()).toMatchObject([{ text: "Ciao", customer: "Rossi" }])
  })

    it("stops at the Free limit", async () => {
    await fillTo(100)
    expect(await addFeedback(user.researchId, valid)).toEqual({ ok: false, reason: "limit" })
    expect(await savedFeedback()).toHaveLength(100)
  })
})

describe("first feedback event", () => {
  beforeEach(() => analytics.trackMilestone.mockClear())

  it("asks for it after a manual feedback is saved, without the text", async () => {
    await addFeedback(user.researchId, { text: "Testo riservato", channel: "Email", customer: "Rossi", receivedAt: "" })
    expect(analytics.trackMilestone).toHaveBeenCalledExactlyOnceWith(user.workspaceId, {
      event: "first_feedback_added",
      properties: { source: "manual" },
    })
  })

  it("asks for it after a CSV import that saved rows, not after a preview or an import of duplicates", async () => {
    const file = "testo\nUno\nDue"
    await previewCsv(user.researchId, csv(file))
    expect(analytics.trackMilestone).not.toHaveBeenCalled()
    await importCsv(user.researchId, csv(file))
    expect(analytics.trackMilestone).toHaveBeenCalledExactlyOnceWith(user.workspaceId, {
      event: "first_feedback_added",
      properties: { source: "csv" },
    })
    analytics.trackMilestone.mockClear()
    expect(await importCsv(user.researchId, csv(file))).toMatchObject({ imported: 0 })
    expect(analytics.trackMilestone).not.toHaveBeenCalled()
  })
})

describe("CSV import", () => {
  const file = [
    "testo;canale;cliente;data",
    "Export lento;Supporto;Rossi;01/09/2026",
    "Export lento;Supporto;Rossi;02/09/2026",
    "Export lento;Supporto;Bianchi;01/09/2026",
    ";Supporto;;",
    "Manca il dark mode;;;",
    "Data sbagliata;Email;;32/01/2026",
  ].join("\n")

  it("previews without saving anything", async () => {
    const preview = await previewCsv(user.researchId, csv(file))
    expect(preview).toMatchObject({ ok: true, newCount: 3, duplicateCount: 1, overLimitCount: 0 })
    if (!preview.ok) return
    expect(preview.invalid.map((r) => r.line)).toEqual([5, 7])
    expect(preview.sample.map((r) => [r.line, r.text, r.customer])).toEqual([
      [2, "Export lento", "Rossi"],
      [4, "Export lento", "Bianchi"],
      [6, "Manca il dark mode", null],
    ])
    expect(await savedFeedback()).toEqual([])
  })

  it("imports the valid rows, skips duplicates in the file and already saved", async () => {
    await admin.from("feedback").insert({ workspace_id: user.workspaceId, research_id: user.researchId, text: "Manca il dark mode", channel: "Importazione CSV" })
    expect(await importCsv(user.researchId, csv(file))).toEqual({ ok: true, imported: 2, duplicateCount: 2, overLimitCount: 0, invalidCount: 2 })
    const saved = await savedFeedback()
    expect(saved).toHaveLength(3)
    expect(saved.filter((f) => f.text === "Export lento")).toEqual([
      { text: "Export lento", channel: "Supporto", customer: "Rossi", received_at: "2026-09-01" },
      { text: "Export lento", channel: "Supporto", customer: "Bianchi", received_at: "2026-09-01" },
    ])
  })

  it("importing the same file again adds nothing", async () => {
    expect(await importCsv(user.researchId, csv(file))).toMatchObject({ imported: 3 })
    expect(await previewCsv(user.researchId, csv(file))).toMatchObject({ ok: true, newCount: 0, duplicateCount: 4 })
    expect(await importCsv(user.researchId, csv(file))).toMatchObject({ imported: 0, duplicateCount: 4 })
    expect(await savedFeedback()).toHaveLength(3)
  })

  it("a duplicate is the same text, channel and customer: other channels or customers count", async () => {
    const same = "testo,canale,cliente\nCiao,Supporto,\nCiao,Email,\nCiao,Supporto,Rossi\nCiao,Supporto,"
    expect(await importCsv(user.researchId, csv(same))).toMatchObject({ imported: 3, duplicateCount: 1 })
  })

  it("on Free, imports only the first rows that fit and says how many stay out", async () => {
    await fillTo(97)
    const rows = ["testo", "Già qui 3", "Uno", "Due", "Tre", "Quattro", "Cinque"].join("\n")
    // "Già qui 3" has a different channel from the one saved, so it is new too.
    expect(await previewCsv(user.researchId, csv(rows))).toMatchObject({ ok: true, newCount: 3, overLimitCount: 3 })
    expect(await importCsv(user.researchId, csv(rows))).toMatchObject({ imported: 3, overLimitCount: 3 })
    const texts = (await savedFeedback()).map((f) => f.text)
    expect(texts).toHaveLength(100)
    expect(texts).toEqual(expect.arrayContaining(["Già qui 3", "Uno", "Due"]))
    expect(texts).not.toContain("Tre")
  })

  it("on a full Free workspace, imports nothing", async () => {
    await fillTo(100)
    expect(await importCsv(user.researchId, csv("testo\nNuovo"))).toMatchObject({ imported: 0, overLimitCount: 1 })
    expect(await savedFeedback()).toHaveLength(100)
  })

  it("imports 2,000 rows on Pro", async () => {
    await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
    try {
      const rows = ["testo,canale", ...Array.from({ length: 2000 }, (_, i) => `"Feedback numero ${i}, con virgola",Supporto`)].join("\n")
      expect(await importCsv(user.researchId, csv(rows))).toMatchObject({ imported: 2000, duplicateCount: 0 })
      expect(await importCsv(user.researchId, csv(rows))).toMatchObject({ imported: 0, duplicateCount: 2000 })
    } finally {
      await admin.from("subscriptions").update({ plan: "free" }).eq("workspace_id", user.workspaceId)
    }
  })

  it("rejects missing, unreadable and oversized files", async () => {
    expect(await previewCsv(user.researchId, new FormData())).toEqual({ ok: false, error: "Scegli un file CSV." })
    const notAFile = new FormData()
    notAFile.set("file", "testo\nCiao")
    expect(await importCsv(user.researchId, notAFile)).toEqual({ ok: false, error: "Scegli un file CSV." })
    expect(await importCsv(user.researchId, csv("feedback\nCiao"))).toMatchObject({ ok: false })
    expect(await importCsv(user.researchId, csv(`testo\n${"a".repeat(1024 * 1024)}`))).toMatchObject({ ok: false })
    expect(await savedFeedback()).toEqual([])
  })
})

describe("public form link", () => {
  const form = async (slug: string) => (await anon().rpc("get_public_form", { slug })).data

  it("turns the link off and on again", async () => {
    expect(await setFormEnabled(user.researchId, false)).toEqual({ ok: true })
    expect(await form(user.formSlug)).toMatchObject([{ accepting: false }])
    expect(await setFormEnabled(user.researchId, true)).toEqual({ ok: true })
    expect(await form(user.formSlug)).toMatchObject([{ accepting: true }])
    // @ts-expect-error not a boolean on purpose
    expect(await setFormEnabled(user.researchId, "no")).toEqual({ ok: false })
  })

  it("a new link kills the old one and is on", async () => {
    await setFormEnabled(user.researchId, false)
    expect(await regenerateFormLink(user.researchId)).toEqual({ ok: true })
    const { data } = await admin.from("research").select("form_slug, form_enabled").eq("id", user.researchId).single()
    expect(data!.form_slug).not.toBe(user.formSlug)
    expect(data!.form_slug).toMatch(/^prova-collect-[a-z0-9]{8}$/)
    expect(data!.form_enabled).toBe(true)
    expect(await form(user.formSlug)).toEqual([])
    expect(await form(data!.form_slug)).toHaveLength(1)
    const old = await admin.rpc("submit_public_feedback", {
      slug: user.formSlug,
      feedback_text: "Dal vecchio QR",
      email: "",
      client_ip: crypto.randomUUID(),
    })
    expect(old.data).toBe("unavailable")
  })

  it("saves the question, up to 140 characters, and goes back to the default when empty", async () => {
    // Read the slug each time: the test above gives the Research a new link.
    const question = async () => {
      const { data } = await admin.from("research").select("form_slug").eq("id", user.researchId).single()
      return (await form(data!.form_slug))![0].question
    }
    expect(await setFormQuestion(user.researchId, "  Cosa ti ha fatto perdere tempo oggi?  ")).toEqual({ ok: true })
    expect(await question()).toBe("Cosa ti ha fatto perdere tempo oggi?")
    expect(await setFormQuestion(user.researchId, "a".repeat(140))).toEqual({ ok: true })
    expect(await question()).toBe("a".repeat(140))
    expect(await setFormQuestion(user.researchId, "a".repeat(141))).toEqual({ ok: false })
    expect(await question()).toBe("a".repeat(140))
    expect(await setFormQuestion(user.researchId, "Con\u0000 NUL?")).toEqual({ ok: true })
    expect(await question()).toBe("Con NUL?")
    expect(await setFormQuestion(user.researchId, "   ")).toEqual({ ok: true })
    expect(await question()).toBe("Cosa vuoi dire al team di Prova collect?")
    // @ts-expect-error not a string on purpose
    expect(await setFormQuestion(user.researchId, null)).toEqual({ ok: false })
  })
})

describe("the Research of another workspace", () => {
  it("cannot be written to or changed through the actions", async () => {
    const other = await createTestUser("collect-other")
    try {
      const valid = { text: "Intruso", channel: "Email", customer: "", receivedAt: "" }
      await expect(addFeedback(other.researchId, valid)).rejects.toThrow()
      await expect(importCsv(other.researchId, csv("testo\nIntruso"))).rejects.toThrow()
      expect(await setFormEnabled(other.researchId, false)).toEqual({ ok: false })
      expect(await regenerateFormLink(other.researchId)).toEqual({ ok: false })
      expect(await setFormQuestion(other.researchId, "Presa?")).toEqual({ ok: false })
      expect(await addFeedback("non-un-uuid", valid)).toEqual({ ok: false, reason: "invalid", fields: [] })
      const { data } = await admin.from("research").select("form_slug, form_enabled, form_question").eq("id", other.researchId).single()
      expect(data).toEqual({ form_slug: other.formSlug, form_enabled: true, form_question: null })
      const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("research_id", other.researchId)
      expect(count).toBe(0)
    } finally {
      await deleteTestUsers([other])
    }
  })
})
