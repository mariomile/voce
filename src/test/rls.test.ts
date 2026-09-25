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
      sentiment: "negative",
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

  it("cannot import feedback into B's workspace, not even as a dry run", async () => {
    const rows = [{ text: "Feedback di B", channel: "Supporto", customer: null, received_at: null }]
    for (const dry_run of [true, false]) {
      const { error } = await a.client.rpc("import_feedback", { ws: b.workspaceId, rows, dry_run })
      expect(error?.code).toBe("42501")
    }
    const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", b.workspaceId)
    expect(count).toBe(1)
  })

  it("cannot skip the server checks by calling the import directly", async () => {
    const row = { text: "Diretto", channel: "Supporto", customer: null, received_at: null }
    for (const bad of [{ received_at: "2999-01-01" }, { received_at: "0001-01-01" }, { text: "\n\t " }]) {
      const { error } = await a.client.rpc("import_feedback", { ws: a.workspaceId, rows: [{ ...row, ...bad }] })
      expect(error?.message).toBe("invalid_rows")
    }
    const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("text", "Diretto")
    expect(count).toBe(0)
  })

    it("cannot give B's form a new link", async () => {
    const { error } = await a.client.rpc("regenerate_form_link", { ws: b.workspaceId })
    expect(error?.code).toBe("42501")
    const { data } = await admin.from("workspaces").select("form_slug").eq("id", b.workspaceId).single()
    expect(data!.form_slug).toBe(b.formSlug)
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

  it("cannot write the Stripe billing fields either", async () => {
    for (const change of [
      { stripe_customer_id: "cus_someone_else" },
      { stripe_status: "active" },
      { cancel_at: null },
      { current_period_end: "2099-01-01T00:00:00Z" },
      { stripe_synced_at: "2099-01-01T00:00:00Z" },
    ]) {
      const { error } = await a.client.from("subscriptions").update(change).eq("workspace_id", a.workspaceId)
      expect(error?.code).toBe("42501")
    }
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
    expect((await untyped(a.client).schema("private").from("form_attempts").select("*")).error).not.toBeNull()
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
    const { data } = await admin.rpc("submit_public_feedback", {
      slug: full.formSlug,
      feedback_text: "Ciao",
      email: "",
      client_ip: crypto.randomUUID(),
    })
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

  it("cannot send feedback through the form function: only the server can", async () => {
    const args = { slug: b.formSlug, feedback_text: "Ciao", email: "", client_ip: "1.2.3.4" }
    expect((await anon().rpc("submit_public_feedback", args)).error?.code).toBe("42501")
    expect((await a.client.rpc("submit_public_feedback", args)).error?.code).toBe("42501")
  })

  it("cannot import feedback or change a form link", async () => {
    const rows = [{ text: "Intruso", channel: "Supporto", customer: null, received_at: null }]
    expect((await anon().rpc("import_feedback", { ws: b.workspaceId, rows })).error?.code).toBe("42501")
    expect((await anon().rpc("regenerate_form_link", { ws: b.workspaceId })).error?.code).toBe("42501")
  })
})

// The server calls the form function with the secret key and the IP it sees.
describe("public form function", () => {
  const send = async (feedback_text: string, email = "", slug = b.formSlug) =>
    (await admin.rpc("submit_public_feedback", { slug, feedback_text, email, client_ip: crypto.randomUUID() })).data

  it("saves the feedback with the channel fixed", async () => {
    expect(await send("  Dal modulo pubblico  ", "giulia@esempio.it")).toBe("ok")
    const { data: saved } = await admin
      .from("feedback")
      .select("text, channel, email")
      .eq("workspace_id", b.workspaceId)
      .eq("channel", "Modulo pubblico")
    expect(saved).toEqual([{ text: "Dal modulo pubblico", channel: "Modulo pubblico", email: "giulia@esempio.it" }])
  })

  it("validates on its own", async () => {
    expect(await send("   ")).toBe("invalid")
    expect(await send("a".repeat(2001))).toBe("invalid")
    expect(await send("Ciao", "non-una-email")).toBe("invalid")
    expect(await send("Ciao", "")).toBe("ok")
  })

  it("gives nothing to a disabled or unknown link", async () => {
    await admin.from("workspaces").update({ form_enabled: false }).eq("id", b.workspaceId)
    const { data: form } = await anon().rpc("get_public_form", { slug: b.formSlug })
    expect(form).toEqual([])
    expect(await send("Ciao")).toBe("unavailable")
    expect((await anon().rpc("get_public_form", { slug: "non-esiste" })).data).toEqual([])
    expect(await send("Ciao", "", "non-esiste")).toBe("unavailable")
    await admin.from("workspaces").update({ form_enabled: true }).eq("id", b.workspaceId)
  })
})

describe("AI analysis functions and log", () => {
  it("only the server reserves, saves or fails an analysis", async () => {
    const start = {
      ws: a.workspaceId,
      model: "finto",
      period_start: "2026-07-01",
      feedback_count: 1,
      input: {},
    }
    const finish = {
      analysis: aIds.analysis,
      themes: [{ title: "Finto", summary: "", kind: "praise", sentiment: "positive", feedback: [aIds.feedback], quotes: [] }],
      run: { cost_usd: 0 },
    }
    const fail = { analysis: aIds.analysis, error: "finto" }
    for (const client of [anon(), a.client]) {
      expect((await client.rpc("start_analysis", start)).error?.code).toBe("42501")
      expect((await client.rpc("finish_analysis", finish)).error?.code).toBe("42501")
      expect((await client.rpc("fail_analysis", fail)).error?.code).toBe("42501")
    }
    const { data } = await admin.from("analyses").select("status").eq("workspace_id", a.workspaceId)
    expect(data).toEqual([{ status: "done" }])
  })

  it("nobody but the server reads or writes the run log, not even their own", async () => {
    const { error } = await admin
      .from("analysis_runs")
      .insert({ analysis_id: aIds.analysis, workspace_id: a.workspaceId, model: "finto", input: { prompt: "segreto" } })
    expect(error).toBeNull()
    for (const client of [anon(), a.client]) {
      expect((await client.from("analysis_runs").select("*")).error?.code).toBe("42501")
      const insert = await client
        .from("analysis_runs")
        .insert({ analysis_id: bIds.analysis, workspace_id: b.workspaceId, model: "finto", input: {} })
      expect(insert.error?.code).toBe("42501")
    }
  })

  it("a user cannot mark their analysis as finished or change its status", async () => {
    const { error } = await a.client.from("analyses").update({ status: "failed" }).eq("id", aIds.analysis)
    expect(error?.code).toBe("42501")
  })
})

describe("analytics milestones", () => {
  it("nobody but the server reads or writes which events a workspace has sent", async () => {
    const { error } = await admin.from("analytics_milestones").insert({ workspace_id: a.workspaceId, event: "signed_up" })
    expect(error).toBeNull()
    for (const client of [anon(), a.client]) {
      expect((await client.from("analytics_milestones").select("*")).error?.code).toBe("42501")
      const insert = await client.from("analytics_milestones").insert({ workspace_id: b.workspaceId, event: "signed_up" })
      expect(insert.error?.code).toBe("42501")
      const remove = await client.from("analytics_milestones").delete().eq("workspace_id", a.workspaceId)
      expect(remove.error?.code).toBe("42501")
    }
  })
})
