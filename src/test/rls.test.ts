import type { SupabaseClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { admin, anon, createTestUser, deleteTestUsers, type Client, type TestUser } from "./supabase"

// Access rules checked through the public API, the way anyone with the publishable key could call it.
// A and B are two fresh users with their own workspaces; B's data is written as the server would.

let a: TestUser
let b: TestUser
let full: TestUser
const bIds = { feedback: "", analysis: "", theme: "" }
const aIds = { feedback: "", analysis: "", theme: "" }

async function seedWorkspace(user: TestUser, label: string) {
  const { data: feedback } = await admin
    .from("feedback")
    .insert({ workspace_id: user.workspaceId, text: `Feedback di ${label}`, channel: "Supporto" })
    .select("id")
    .single()
  const { data: analysis } = await admin
    .from("analyses")
    .insert({ workspace_id: user.workspaceId, period_start: "2026-07-01", feedback_count: 1 })
    .select("id")
    .single()
  const { data: theme } = await admin
    .from("themes")
    .insert({
      workspace_id: user.workspaceId,
      analysis_id: analysis!.id,
      kind: "problem",
      title: `Tema di ${label}`,
      summary: "Sintesi",
    })
    .select("id")
    .single()
  await admin.from("theme_feedback").insert({
    workspace_id: user.workspaceId,
    theme_id: theme!.id,
    feedback_id: feedback!.id,
    quote_rank: 1,
    highlight: "Feedback",
  })
  return { feedback: feedback!.id, analysis: analysis!.id, theme: theme!.id }
}

beforeAll(async () => {
  ;[a, b, full] = await Promise.all([createTestUser("a"), createTestUser("b"), createTestUser("full")])
  Object.assign(aIds, await seedWorkspace(a, "A"))
  Object.assign(bIds, await seedWorkspace(b, "B"))
})

afterAll(() => deleteTestUsers([a, b, full]))

// The table loops below pick names at runtime, which the typed client cannot follow.
const untyped = (client: Client) => client as unknown as SupabaseClient

const WORKSPACE_TABLES = [
  "workspace_members",
  "subscriptions",
  "feedback",
  "analyses",
  "themes",
  "theme_feedback",
  "feedback_channels",
  "theme_stats",
] as const

describe("signup", () => {
  it("gives every new user their own workspace, as owner, on the Free plan", async () => {
    const { data: workspaces } = await a.client.from("workspaces").select("id, name")
    expect(workspaces).toEqual([{ id: a.workspaceId, name: "Prova a" }])
    const { data: members } = await a.client.from("workspace_members").select("user_id, role")
    expect(members).toEqual([{ user_id: a.userId, role: "owner" }])
    const { data: subscription } = await a.client.from("subscriptions").select("plan").single()
    expect(subscription).toEqual({ plan: "free" })
    expect(a.workspaceId).not.toBe(b.workspaceId)
  })
})

describe("a user cannot read another workspace", () => {
  it("sees only their own workspace", async () => {
    const { data } = await a.client.from("workspaces").select("id")
    expect(data!.map((w) => w.id)).toEqual([a.workspaceId])
    const { data: direct, error } = await a.client.from("workspaces").select("id").eq("id", b.workspaceId)
    expect(error).toBeNull()
    expect(direct).toEqual([])
  })

  it.each(WORKSPACE_TABLES)("%s: only own rows, nothing when asking for B's", async (table) => {
    const own = await untyped(a.client).from(table).select("workspace_id")
    expect(own.error).toBeNull()
    expect(own.data!.length).toBeGreaterThan(0)
    expect(own.data!.every((r: { workspace_id: string }) => r.workspace_id === a.workspaceId)).toBe(true)
    const other = await untyped(a.client).from(table).select("*").eq("workspace_id", b.workspaceId)
    expect(other.error).toBeNull()
    expect(other.data).toEqual([])
  })

  it("cannot open B's theme or feedback by id", async () => {
    expect((await a.client.from("themes").select("*").eq("id", bIds.theme)).data).toEqual([])
    expect((await a.client.from("feedback").select("*").eq("id", bIds.feedback)).data).toEqual([])
  })
})

describe("a user cannot change another workspace", () => {
  it("cannot rename B's workspace or change its form", async () => {
    const { data } = await a.client
      .from("workspaces")
      .update({ name: "Preso", form_enabled: false })
      .eq("id", b.workspaceId)
      .select()
    expect(data).toEqual([])
    const { data: after } = await admin.from("workspaces").select("name, form_enabled").eq("id", b.workspaceId).single()
    expect(after).toEqual({ name: "Prova b", form_enabled: true })
  })

  it("cannot change B's themes", async () => {
    const { data } = await a.client.from("themes").update({ status: "discarded" }).eq("id", bIds.theme).select()
    expect(data).toEqual([])
    const { data: after } = await admin.from("themes").select("status").eq("id", bIds.theme).single()
    expect(after!.status).toBe("to_review")
  })

  it("cannot add feedback to B's workspace", async () => {
    const { error } = await a.client
      .from("feedback")
      .insert({ workspace_id: b.workspaceId, text: "Intruso", channel: "Supporto" })
    expect(error?.code).toBe("42501")
  })

  it("cannot delete B's feedback", async () => {
    const { error } = await a.client.from("feedback").delete().eq("id", bIds.feedback)
    expect(error?.code).toBe("42501")
    const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("id", bIds.feedback)
    expect(count).toBe(1)
  })

  it("cannot join B's workspace", async () => {
    const { error } = await a.client
      .from("workspace_members")
      .insert({ workspace_id: b.workspaceId, user_id: a.userId, role: "owner" })
    expect(error?.code).toBe("42501")
  })

  it("cannot link its own feedback to B's theme", async () => {
    const { error } = await a.client
      .from("theme_feedback")
      .insert({ workspace_id: b.workspaceId, theme_id: bIds.theme, feedback_id: aIds.feedback })
    expect(error?.code).toBe("42501")
  })
})

describe("plan and billing", () => {
  it("a user cannot give their workspace the Pro plan", async () => {
    const { error } = await a.client.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", a.workspaceId)
    expect(error?.code).toBe("42501")
    const { data } = await admin.from("subscriptions").select("plan").eq("workspace_id", a.workspaceId).single()
    expect(data!.plan).toBe("free")
  })

  it("cannot recreate or delete the subscription either", async () => {
    const upsert = await a.client.from("subscriptions").upsert({ workspace_id: a.workspaceId, plan: "pro" })
    expect(upsert.error?.code).toBe("42501")
    const del = await a.client.from("subscriptions").delete().eq("workspace_id", a.workspaceId)
    expect(del.error?.code).toBe("42501")
    const { data } = await admin.from("subscriptions").select("plan").eq("workspace_id", a.workspaceId).single()
    expect(data!.plan).toBe("free")
  })

  it("editing the user's own metadata does not change the plan", async () => {
    await a.client.auth.updateUser({ data: { plan: "pro" } })
    const { data } = await a.client.from("subscriptions").select("plan").single()
    expect(data!.plan).toBe("free")
  })

  it("cannot change their own role or move the workspace", async () => {
    const role = await a.client.from("workspace_members").update({ role: "member" }).eq("user_id", a.userId)
    expect(role.error?.code).toBe("42501")
    const id = await a.client.from("workspaces").update({ id: crypto.randomUUID() }).eq("id", a.workspaceId)
    expect(id.error?.code).toBe("42501")
  })

  it("cannot call the internal functions", async () => {
    // The private schema is not in the typed client, on purpose.
    const { error } = await untyped(a.client).schema("private").rpc("feedback_limit", { ws: a.workspaceId })
    expect(error).not.toBeNull()
    expect((await untyped(a.client).schema("private").rpc("my_workspace_ids")).error).not.toBeNull()
  })
})

describe("in their own workspace", () => {
  it("can add feedback and set priority and status", async () => {
    const insert = await a.client
      .from("feedback")
      .insert({ workspace_id: a.workspaceId, text: "Nuovo feedback", channel: "Call vendita" })
    expect(insert.error).toBeNull()
    const { data } = await a.client
      .from("themes")
      .update({ priority: "high", status: "roadmap" })
      .eq("id", aIds.theme)
      .select("priority, status")
    expect(data).toEqual([{ priority: "high", status: "roadmap" }])
  })

  it("cannot add a feedback longer than 2,000 characters, even through the API", async () => {
    const { error } = await a.client
      .from("feedback")
      .insert({ workspace_id: a.workspaceId, text: "a".repeat(2001), channel: "Supporto" })
    expect(error?.code).toBe("23514")
  })

  it("can change the form question, within 140 characters", async () => {
    const ok = await a.client.from("workspaces").update({ form_question: "Cosa ti blocca?" }).eq("id", a.workspaceId)
    expect(ok.error).toBeNull()
    const long = await a.client
      .from("workspaces")
      .update({ form_question: "a".repeat(141) })
      .eq("id", a.workspaceId)
    expect(long.error?.code).toBe("23514")
  })

  it("cannot write what only the analysis writes", async () => {
    const analysis = await a.client
      .from("analyses")
      .insert({ workspace_id: a.workspaceId, period_start: "2026-07-01", feedback_count: 0 })
    expect(analysis.error?.code).toBe("42501")
    const theme = await a.client.from("themes").update({ title: "Riscritto" }).eq("id", aIds.theme)
    expect(theme.error?.code).toBe("42501")
    const link = await a.client
      .from("theme_feedback")
      .insert({ workspace_id: a.workspaceId, theme_id: aIds.theme, feedback_id: aIds.feedback })
    expect(link.error?.code).toBe("42501")
  })

  it("cannot choose the public form link", async () => {
    const { error } = await a.client.from("workspaces").update({ form_slug: "preso" }).eq("id", a.workspaceId)
    expect(error?.code).toBe("42501")
  })
})

describe("Free limit of 100 feedback", () => {
  beforeAll(async () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      workspace_id: full.workspaceId,
      text: `Feedback ${i + 1}`,
      channel: "Supporto",
    }))
    const { error } = await admin.from("feedback").insert(rows)
    if (error) throw error
  })

  it("rejects the 101st feedback, even through the API", async () => {
    const { error } = await full.client
      .from("feedback")
      .insert({ workspace_id: full.workspaceId, text: "Il numero 101", channel: "Supporto" })
    expect(error?.message).toBe("feedback_limit_reached")
    const { count } = await admin
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", full.workspaceId)
    expect(count).toBe(100)
  })

  it("closes the public form", async () => {
    const { data: form } = await anon().rpc("get_public_form", { slug: full.formSlug })
    expect(form).toEqual([{ workspace_name: "Prova full", question: "Cosa vuoi dire al team di Prova full?", accepting: false }])
    const { data } = await anon().rpc("submit_public_feedback", { slug: full.formSlug, feedback_text: "Ciao" })
    expect(data).toBe("unavailable")
  })
})

describe("anonymous visitor", () => {
  it.each(["workspaces", ...WORKSPACE_TABLES] as const)("cannot read %s", async (table) => {
    const { data, error } = await untyped(anon()).from(table).select("*")
    expect(error?.code).toBe("42501")
    expect(data).toBeNull()
  })

  it("cannot write feedback directly", async () => {
    const { error } = await anon().from("feedback").insert({ workspace_id: b.workspaceId, text: "Ciao", channel: "Supporto" })
    expect(error?.code).toBe("42501")
  })

  it("reads only what the public form shows", async () => {
    const { data } = await anon().rpc("get_public_form", { slug: b.formSlug })
    expect(data).toEqual([{ workspace_name: "Prova b", question: "Cosa vuoi dire al team di Prova b?", accepting: true }])
  })

  it("sends feedback through the form, with the channel fixed", async () => {
    const { data } = await anon().rpc("submit_public_feedback", {
      slug: b.formSlug,
      feedback_text: "  Dal modulo pubblico  ",
      email: "giulia@esempio.it",
    })
    expect(data).toBe("ok")
    const { data: saved } = await admin
      .from("feedback")
      .select("text, channel, email")
      .eq("workspace_id", b.workspaceId)
      .eq("channel", "Modulo pubblico")
    expect(saved).toEqual([{ text: "Dal modulo pubblico", channel: "Modulo pubblico", email: "giulia@esempio.it" }])
  })

  it("the form function validates on its own", async () => {
    const send = async (feedback_text: string, email?: string) =>
      (await anon().rpc("submit_public_feedback", { slug: b.formSlug, feedback_text, email })).data
    expect(await send("   ")).toBe("invalid")
    expect(await send("a".repeat(2001))).toBe("invalid")
    expect(await send("Ciao", "non-una-email")).toBe("invalid")
    expect(await send("Ciao", "")).toBe("ok")
  })

  it("gets nothing from a disabled or unknown link", async () => {
    await admin.from("workspaces").update({ form_enabled: false }).eq("id", b.workspaceId)
    const { data: form } = await anon().rpc("get_public_form", { slug: b.formSlug })
    expect(form).toEqual([])
    const { data } = await anon().rpc("submit_public_feedback", { slug: b.formSlug, feedback_text: "Ciao" })
    expect(data).toBe("unavailable")
    expect((await anon().rpc("get_public_form", { slug: "non-esiste" })).data).toEqual([])
    await admin.from("workspaces").update({ form_enabled: true }).eq("id", b.workspaceId)
  })
})
