import { beforeAll, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, signIn, type Client } from "@/test/supabase"

// Reads run against the seed (`supabase db reset`), signed in as the seed users.
const session = vi.hoisted(() => ({ client: null as unknown }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))

const {
  FEEDBACK_PAGE_SIZE,
  getCurrentWorkspace,
  getDashboard,
  getPublicForm,
  getResearch,
  getResearchStats,
  getTheme,
  getUsage,
  listFeedback,
  listHypotheses,
  listResearch,
} = await import("./data")

const users: Record<"fatturino" | "orto" | "ordinalo", Client> = {} as never
const workspaceIds: Record<string, string> = {}

beforeAll(async () => {
  for (const name of ["fatturino", "orto", "ordinalo"] as const) {
    users[name] = await signIn(`${name}@voce.test`)
    const { data } = await users[name].from("workspaces").select("id").single()
    workspaceIds[name] = data!.id
  }
})

function as(name: keyof typeof users) {
  session.client = users[name]
  return workspaceIds[name]
}

// The first Research of a seed workspace, signed in as its owner: the one with the feedback and analyses.
async function initial(name: keyof typeof users) {
  const workspaceId = as(name)
  const list = await listResearch(workspaceId)
  return { id: list.at(-1)!.id, workspaceId }
}

describe("getCurrentWorkspace", () => {
  it("is the signed-in user's workspace", async () => {
    as("orto")
    expect(await getCurrentWorkspace()).toEqual({ id: workspaceIds.orto, name: "Orto" })
  })
})

describe("the Research of the seed", () => {
  it("listResearch gives the newest first, with the number of feedback", async () => {
    const list = await listResearch(as("fatturino"))
    expect(list.map((r) => [r.question, r.formEnabled, r.feedbackCount > 0])).toEqual([
      ["Come usano l'export in Excel i clienti Pro?", true, false],
      ["Cosa dicono i clienti di Fatturino?", true, true],
    ])
    expect(list[0].feedbackCount).toBe(0)
  })

  it("getResearch reads the form of the Research", async () => {
    as("orto")
    const [orto] = await listResearch(workspaceIds.orto)
    expect(await getResearch(orto.id)).toMatchObject({
      workspaceId: workspaceIds.orto,
      formSlug: "orto-p2x8",
      formEnabled: true,
      formQuestion: "Cosa ti ha fatto perdere tempo questa settimana con Orto?",
    })
  })

  it("getResearch is null for another workspace's Research, an unknown id and a non-uuid", async () => {
    const [orto] = await listResearch(as("orto"))
    as("fatturino")
    expect(await getResearch(orto.id)).toBeNull()
    expect(await getResearch(crypto.randomUUID())).toBeNull()
    expect(await getResearch("non-un-uuid")).toBeNull()
  })

  it("getResearchStats counts feedback, channels and the dates of one Research", async () => {
    const [orto] = await listResearch(as("orto"))
    const stats = await getResearchStats({ id: orto.id, workspaceId: workspaceIds.orto })
    expect(stats.feedbackCount).toBe(orto.feedbackCount)
    expect(stats.channelCount).toBeGreaterThan(0)
    expect(stats.firstReceivedAt! <= stats.lastReceivedAt!).toBe(true)
  })
})

describe("listHypotheses", () => {
  it("lists the hypotheses of the Research by position, each with its verdict or none", async () => {
    const user = await createTestUser("hypotheses-list")
    try {
      const rows = await admin
        .from("research_hypotheses")
        .insert([1, 2].map((n) => ({ workspace_id: user.workspaceId, research_id: user.researchId, text: `Ipotesi ${n}` })))
        .select("id, text, written_at")
      const first = rows.data!.find((h) => h.text === "Ipotesi 1")!
      const second = rows.data!.find((h) => h.text === "Ipotesi 2")!
      const analysis = await admin
        .from("analyses")
        .insert({ workspace_id: user.workspaceId, research_id: user.researchId, kind: "verdict", period_start: "2026-10-01", feedback_count: 5, status: "done" })
        .select("id, created_at")
        .single()
      const texts = ["Siamo in due, pagare a testa non ha senso.", "Costa troppo per utente.", "Il prezzo va bene, mi manca l'export.", "Uno che non si cita.", "Un altro a favore."]
      const feedback = await admin
        .from("feedback")
        .insert(texts.map((text, i) => ({
          workspace_id: user.workspaceId,
          research_id: user.researchId,
          text,
          channel: i === 2 ? "Modulo pubblico" : "Intervista",
          customer: "Anna Rossi",
          received_at: `2026-10-0${i + 1}`,
        })))
        .select("id, text")
      const id = (text: string) => feedback.data!.find((f) => f.text === text)!.id
      await admin.from("hypothesis_verdicts").insert({
        hypothesis_id: second.id,
        workspace_id: user.workspaceId,
        research_id: user.researchId,
        analysis_id: analysis.data!.id,
        verdict: "confirmed",
        reasoning: "Chi ha 2-3 persone trova il costo per utente sproporzionato.",
        feedback_read: 37,
        arrived_after: 29,
      })
      await admin.from("verdict_feedback").insert([
        { hypothesis_id: second.id, workspace_id: user.workspaceId, feedback_id: id(texts[1]), stance: "for", quote_rank: 2, highlight: "per utente" },
        { hypothesis_id: second.id, workspace_id: user.workspaceId, feedback_id: id(texts[0]), stance: "for", quote_rank: 1, highlight: "pagare a testa non ha senso" },
        { hypothesis_id: second.id, workspace_id: user.workspaceId, feedback_id: id(texts[4]), stance: "for" },
        { hypothesis_id: second.id, workspace_id: user.workspaceId, feedback_id: id(texts[2]), stance: "against", quote_rank: 1, highlight: "mi manca l'export" },
      ])
      // Two feedback entered Voce after the verdict analysis started, one before.
      const after = new Date(Date.parse(analysis.data!.created_at) + 60_000).toISOString()
      const before = new Date(Date.parse(analysis.data!.created_at) - 60_000).toISOString()
      await admin.from("feedback").update({ created_at: after }).in("id", [id(texts[3]), id(texts[4])])
      await admin.from("feedback").update({ created_at: before }).in("id", [id(texts[0]), id(texts[1]), id(texts[2])])

      session.client = user.client
      const list = await listHypotheses({ id: user.researchId, workspaceId: user.workspaceId })
      expect(list).toEqual([
        { id: first.id, text: "Ipotesi 1", writtenAt: first.written_at, verdict: null },
        {
          id: second.id,
          text: "Ipotesi 2",
          writtenAt: second.written_at,
          verdict: {
            verdict: "confirmed",
            reasoning: "Chi ha 2-3 persone trova il costo per utente sproporzionato.",
            feedbackRead: 37,
            arrivedAfter: 29,
            supporting: 3,
            contradicting: 1,
            quotesFor: [
              { feedbackId: id(texts[0]), text: texts[0], highlight: "pagare a testa non ha senso", channel: "Intervista", receivedAt: "2026-10-01" },
              { feedbackId: id(texts[1]), text: texts[1], highlight: "per utente", channel: "Intervista", receivedAt: "2026-10-02" },
            ],
            quotesAgainst: [
              { feedbackId: id(texts[2]), text: texts[2], highlight: "mi manca l'export", channel: "Modulo pubblico", receivedAt: "2026-10-03" },
            ],
            arrivedAfterVerdict: 2,
          },
        },
      ])
    } finally {
      await deleteTestUsers([user])
    }
  })
})

describe("getDashboard", () => {
  it("shows open themes by default, sorted by feedback count", async () => {
    const { themes } = await getDashboard(await initial("fatturino"))
    expect(themes.length).toBeGreaterThan(0)
    expect(themes.every((t) => t.status === "to_review" || t.status === "roadmap")).toBe(true)
    const counts = themes.map((t) => t.feedbackCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it("counts come from the linked feedback, trend covers 13 weeks", async () => {
    const { themes, analysisThemeCount } = await getDashboard(await initial("fatturino"), { status: "all" })
    expect(themes).toHaveLength(analysisThemeCount)
    for (const t of themes) {
      const { count } = await admin.from("theme_feedback").select("*", { count: "exact", head: true }).eq("theme_id", t.id)
      expect(t.feedbackCount).toBe(count)
      expect(t.trend).toHaveLength(13)
      expect(t.trend.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(t.feedbackCount)
      expect(t.quotes.length).toBeGreaterThan(0)
    }
  })

  it("filters by kind and status", async () => {
    const id = await initial("fatturino")
    const all = await getDashboard(id, { status: "all" })
    const problems = await getDashboard(id, { status: "all", kind: "problem" })
    expect(problems.themes.every((t) => t.kind === "problem")).toBe(true)
    expect(problems.themes).toHaveLength(all.kindCounts.problem)
    const discarded = await getDashboard(id, { status: "discarded" })
    expect(discarded.themes.length).toBeGreaterThan(0)
    expect(discarded.themes.every((t) => t.status === "discarded")).toBe(true)
  })

  it("shows the latest analysis and the 6 most recent feedback", async () => {
    const { analysis, recentFeedback, feedbackCount } = await getDashboard(await initial("fatturino"))
    const { data: latest } = await admin
      .from("analyses")
      .select("id")
      .eq("workspace_id", workspaceIds.fatturino)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    expect(analysis!.id).toBe(latest!.id)
    expect(feedbackCount).toBe(55)
    expect(recentFeedback).toHaveLength(6)
    const dates = recentFeedback.map((f) => f.receivedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it("has no analysis for a Research that never ran one, even when another Research of the workspace did", async () => {
    const fatturino = await initial("fatturino")
    const [second] = await listResearch(fatturino.workspaceId)
    const empty = await getDashboard({ id: second.id, workspaceId: fatturino.workspaceId })
    expect(empty.analysis).toBeNull()
    expect(empty.feedbackCount).toBe(0)
  })

  it("has no analysis for a workspace that never ran one", async () => {
    const dashboard = await getDashboard(await initial("orto"))
    expect(dashboard.analysis).toBeNull()
    expect(dashboard.themes).toEqual([])
    expect(dashboard.feedbackCount).toBeGreaterThan(0)
  })
})

describe("quotes", () => {
  it("every highlight is an exact part of its feedback", async () => {
    as("fatturino")
    const { data } = await admin.from("theme_feedback").select("highlight, feedback (text)").not("highlight", "is", null)
    expect(data!.length).toBeGreaterThan(0)
    for (const link of data!) expect(link.feedback.text).toContain(link.highlight)
  })
})

describe("getTheme", () => {
  it("returns the theme with all its linked feedback", async () => {
    const id = await initial("fatturino")
    const { themes } = await getDashboard(id, { status: "all" })
    const theme = await getTheme(id, themes[0].id)
    expect(theme!.title).toBe(themes[0].title)
    expect(theme!.feedback).toHaveLength(theme!.feedbackCount)
    expect(theme!.quotes).toEqual(themes[0].quotes)
    expect(theme!.trend).toEqual(themes[0].trend)
  })

  it("is null for another workspace's theme and for ids that are not uuids", async () => {
    const fatturino = await initial("fatturino")
    const { themes } = await getDashboard(fatturino, { status: "all" })
    expect(await getTheme(await initial("orto"), themes[0].id)).toBeNull()
    // Even passing the owner's Research: RLS answers for the signed-in user.
    as("orto")
    expect(await getTheme(fatturino, themes[0].id)).toBeNull()
    expect(await getTheme(await initial("fatturino"), "th_fatturino_1")).toBeNull()
  })

  it("is null for a theme of another Research of the same workspace", async () => {
    const fatturino = await initial("fatturino")
    const { themes } = await getDashboard(fatturino, { status: "all" })
    const [second] = await listResearch(fatturino.workspaceId)
    expect(await getTheme({ id: second.id, workspaceId: fatturino.workspaceId }, themes[0].id)).toBeNull()
  })
})

describe("what changed since the previous analysis", () => {
  it("what changed compares with the previous themes analysis of the same Research", async () => {
    const user = await createTestUser("changes")
    try {
      const other = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Altra?" })
      const ago = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      const r = { workspace_id: user.workspaceId, research_id: user.researchId }
      const { data: fb } = await admin
        .from("feedback")
        .insert([
          { ...r, text: "Uno", channel: "Supporto", created_at: ago(72) },
          { ...r, text: "Due", channel: "Supporto", created_at: ago(72) },
          { ...r, text: "Tre", channel: "Supporto", created_at: ago(24) },
          { workspace_id: user.workspaceId, research_id: other.data!, text: "Altrove", channel: "Supporto", created_at: ago(24) },
        ])
        .select("id, text")
      const id = (text: string) => fb!.find((f) => f.text === text)!.id
      const analysis = async (researchId: string, createdAt: string, kind: "themes" | "verdict" = "themes") =>
        (
          await admin
            .from("analyses")
            .insert({ workspace_id: user.workspaceId, research_id: researchId, kind, period_start: "2026-09-01", feedback_count: 2, created_at: createdAt })
            .select("id, created_at")
            .single()
        ).data!
      const theme = async (analysisId: string, researchId: string, title: string, feedback: string[]) => {
        const { data } = await admin
          .from("themes")
          .insert({ workspace_id: user.workspaceId, research_id: researchId, analysis_id: analysisId, kind: "problem", title, summary: "S", sentiment: "negative" })
          .select("id")
          .single()
        await admin.from("theme_feedback").insert(feedback.map((f) => ({ workspace_id: user.workspaceId, theme_id: data!.id, feedback_id: f })))
      }
      const first = await analysis(user.researchId, ago(48))
      await theme(first.id, user.researchId, "Banca", [id("Uno")])
      await theme(first.id, user.researchId, "Vecchio", [id("Due")])
      session.client = user.client
      const research = { id: user.researchId, workspaceId: user.workspaceId }

      const once = await getDashboard(research, { status: "all" })
      expect(once.changes).toBeNull()
      expect(once.themes.map((t) => t.change)).toEqual([null, null])

      // Newer rows that must not count as the previous analysis: another Research's, and a verdict.
      const elsewhere = await analysis(other.data!, ago(36))
      await theme(elsewhere.id, other.data!, "Banca", [id("Altrove")])
      await analysis(user.researchId, ago(12), "verdict")
      const second = await analysis(user.researchId, ago(1))
      await theme(second.id, user.researchId, "banca", [id("Uno"), id("Tre")])
      await theme(second.id, user.researchId, "Nuovo", [id("Due")])

      const twice = await getDashboard(research, { status: "all" })
      expect(twice.analysis!.id).toBe(second.id)
      expect(twice.changes).toEqual({ since: first.created_at, newFeedback: 1, newThemes: 1 })
      expect(twice.themes.map((t) => [t.title, t.change])).toEqual([
        ["banca", { kind: "more", count: 1, since: first.created_at }],
        ["Nuovo", { kind: "new" }],
      ])
    } finally {
      await deleteTestUsers([user])
    }
  })
})

describe("listFeedback", () => {
  it("lists only the Research's feedback", async () => {
    const id = as("orto")
    const [orto] = await listResearch(id)
    const { feedback } = await listFeedback({ id: orto.id, workspaceId: id })
    expect(feedback.length).toBeGreaterThan(0)
    expect(feedback.every((f) => f.workspaceId === id)).toBe(true)
  })

  it("filters by channel, newest first", async () => {
    const id = as("fatturino")
    const initial = (await listResearch(id)).find((r) => r.feedbackCount > 0)!
    const { feedback, channels, total } = await listFeedback({ id: initial.id, workspaceId: id }, { channel: "Supporto" })
    expect(feedback.length).toBe(channels.find((c) => c.name === "Supporto")!.count)
    expect(feedback.every((f) => f.channel === "Supporto")).toBe(true)
    expect(total).toBe(55)
    const dates = feedback.map((f) => f.receivedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it("leaves out the feedback and channels of another Research of the same workspace", async () => {
    const user = await createTestUser("list-research")
    try {
      const second = await user.client.rpc("create_research", { ws: user.workspaceId, question: "Seconda?" })
      await admin.from("feedback").insert([
        { workspace_id: user.workspaceId, research_id: user.researchId, text: "Mia", channel: "Supporto" },
        { workspace_id: user.workspaceId, research_id: second.data!, text: "Altrui", channel: "Intervista" },
      ])
      session.client = user.client
      const list = await listFeedback({ id: user.researchId, workspaceId: user.workspaceId })
      expect(list.feedback.map((f) => f.text)).toEqual(["Mia"])
      expect(list.channels).toEqual([{ name: "Supporto", count: 1 }])
      expect(list.total).toBe(1)
    } finally {
      await deleteTestUsers([user])
    }
  })
})

describe("listFeedback pages", () => {
  it("reads one page at a time, also by channel", async () => {
    const user = await createTestUser("big")
    try {
      await admin.from("subscriptions").update({ plan: "pro" }).eq("workspace_id", user.workspaceId)
      const rows = Array.from({ length: 1050 }, (_, i) => ({
        workspace_id: user.workspaceId,
        research_id: user.researchId,
        text: `Feedback ${i}`,
        channel: i % 2 ? "Supporto" : "Call vendita",
      }))
      const { error } = await admin.from("feedback").insert(rows)
      if (error) throw error
      session.client = user.client
      const research = { id: user.researchId, workspaceId: user.workspaceId }
      const first = await listFeedback(research)
      expect(first).toMatchObject({ total: 1050, page: 1, pageCount: 11 })
      expect(first.feedback).toHaveLength(FEEDBACK_PAGE_SIZE)

      const pages = await Promise.all(
        Array.from({ length: 11 }, (_, i) => listFeedback(research, { page: i + 1 }))
      )
      expect(pages[10].feedback).toHaveLength(50)
      expect(new Set(pages.flatMap((p) => p.feedback.map((f) => f.id))).size).toBe(1050)

      const support = await listFeedback(research, { channel: "Supporto", page: 6 })
      expect(support).toMatchObject({ page: 6, pageCount: 6 })
      expect(support.feedback).toHaveLength(25)
      expect(support.feedback.every((f) => f.channel === "Supporto")).toBe(true)

      // A page beyond the last shows the last one.
      expect((await listFeedback(research, { page: 99 })).page).toBe(11)
    } finally {
      await deleteTestUsers([user])
    }
  })
})

describe("getPublicForm", () => {
  it("uses the default question when the PM did not choose one", async () => {
    session.client = (await import("@/test/supabase")).anon()
    expect(await getPublicForm("fatturino-k3m9")).toEqual({
      workspaceName: "Fatturino",
      question: "Cosa vuoi dire al team di Fatturino?",
      accepting: true,
    })
  })

  it("uses the PM's question", async () => {
    const form = await getPublicForm("orto-p2x8")
    expect(form?.question).toBe("Cosa ti ha fatto perdere tempo questa settimana con Orto?")
  })

  it("stops accepting at the Free limit of 100 feedback", async () => {
    expect((await getPublicForm("ordinalo-7fq2"))?.accepting).toBe(false)
  })

  it("does not accept feedback when the link is disabled, and does not exist when unknown", async () => {
    expect(await getPublicForm("spento-a1b2")).toEqual({
      workspaceName: "Spento",
      question: "Cosa vuoi dire al team di Spento?",
      accepting: false,
    })
    expect(await getPublicForm("nope")).toBeNull()
  })
})

describe("getUsage", () => {
  it("reads limits from the plan", async () => {
    const pro = await getUsage(as("fatturino"))
    expect(pro).toMatchObject({ plan: "pro", feedbackCount: 55, feedbackLimit: null, analysesLimit: 100 })
    expect(pro.analysesThisMonth).toBeGreaterThan(0)
    const free = await getUsage(as("ordinalo"))
    expect(free).toMatchObject({ plan: "free", feedbackCount: 100, feedbackLimit: 100, analysesLimit: 3 })
  })
})

describe("getUsage: questions", () => {
  it("counts the questions of the month apart from the analyses", async () => {
    const user = await createTestUser("usage")
    try {
      session.client = user.client
      await admin.from("questions").insert(
        Array.from({ length: 10 }, (_, i) => ({
          workspace_id: user.workspaceId,
          status: i % 2 ? ("failed" as const) : ("done" as const),
          outcome: i % 2 ? null : ("answered" as const),
          feedback_considered: 1,
        }))
      )
      expect(await getUsage(user.workspaceId)).toMatchObject({
        plan: "free",
        analysesThisMonth: 0,
        questionsThisMonth: 10,
        questionsLimit: 10,
      })
    } finally {
      await deleteTestUsers([user])
    }
  })
})

