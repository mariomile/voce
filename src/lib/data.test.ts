import { describe, expect, it } from "vitest"
import { getDashboard, getPublicForm, getTheme, getUsage, listFeedback } from "./data"
import * as db from "./mock-data"

describe("getDashboard", () => {
  it("shows open themes by default, sorted by feedback count", async () => {
    const { themes } = await getDashboard("ws_fatturino")
    expect(themes.length).toBeGreaterThan(0)
    expect(themes.every((t) => t.status === "to_review" || t.status === "roadmap")).toBe(true)
    const counts = themes.map((t) => t.feedbackCount)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it("counts come from the linked feedback, trend covers 13 weeks", async () => {
    const { themes } = await getDashboard("ws_fatturino", { status: "all" })
    for (const t of themes) {
      const links = db.themeFeedback.filter((l) => l.themeId === t.id)
      expect(t.feedbackCount).toBe(links.length)
      expect(t.trend).toHaveLength(13)
      expect(t.trend.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(t.feedbackCount)
    }
  })

  it("filters by kind and status", async () => {
    const all = await getDashboard("ws_fatturino", { status: "all" })
    const problems = await getDashboard("ws_fatturino", { status: "all", kind: "problem" })
    expect(problems.themes.every((t) => t.kind === "problem")).toBe(true)
    expect(problems.themes).toHaveLength(all.kindCounts.problem)
    const discarded = await getDashboard("ws_fatturino", { status: "discarded" })
    expect(discarded.themes.every((t) => t.status === "discarded")).toBe(true)
  })

  it("has no analysis for a workspace that never ran one", async () => {
    const dashboard = await getDashboard("ws_orto")
    expect(dashboard.analysis).toBeNull()
    expect(dashboard.themes).toEqual([])
    expect(dashboard.feedbackCount).toBeGreaterThan(0)
  })
})

describe("quotes", () => {
  it("every highlight is an exact part of its feedback", () => {
    for (const link of db.themeFeedback.filter((l) => l.highlight)) {
      const f = db.feedback.find((x) => x.id === link.feedbackId)!
      expect(f.text).toContain(link.highlight)
    }
  })

  it("a feedback sits in at most 3 themes", () => {
    const perFeedback = new Map<string, number>()
    for (const l of db.themeFeedback) perFeedback.set(l.feedbackId, (perFeedback.get(l.feedbackId) ?? 0) + 1)
    expect(Math.max(...perFeedback.values())).toBeLessThanOrEqual(3)
  })
})

describe("workspace isolation", () => {
  it("does not return a theme of another workspace", async () => {
    const theme = db.themes.find((t) => t.workspaceId === "ws_fatturino")!
    expect(await getTheme("ws_fatturino", theme.id)).not.toBeNull()
    expect(await getTheme("ws_orto", theme.id)).toBeNull()
  })

  it("lists only the workspace's feedback", async () => {
    const { feedback } = await listFeedback("ws_orto")
    expect(feedback.length).toBeGreaterThan(0)
    expect(feedback.every((f) => f.workspaceId === "ws_orto")).toBe(true)
  })
})

describe("listFeedback", () => {
  it("filters by channel, newest first", async () => {
    const { feedback, channels, total } = await listFeedback("ws_fatturino", { channel: "Supporto" })
    expect(feedback.length).toBe(channels.find((c) => c.name === "Supporto")!.count)
    expect(feedback.every((f) => f.channel === "Supporto")).toBe(true)
    expect(channels.reduce((sum, c) => sum + c.count, 0)).toBe(total)
    const dates = feedback.map((f) => f.receivedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })
})

describe("getPublicForm", () => {
  it("uses the default question when the PM did not choose one", async () => {
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

  it("does not exist when the link is disabled or unknown", async () => {
    expect(await getPublicForm("spento-a1b2")).toBeNull()
    expect(await getPublicForm("nope")).toBeNull()
  })
})

describe("getUsage", () => {
  it("reads limits from the plan", async () => {
    const pro = await getUsage("ws_fatturino", new Date("2026-09-25"))
    expect(pro).toMatchObject({ plan: "pro", feedbackLimit: null, analysesThisMonth: 7, analysesLimit: 100 })
    const free = await getUsage("ws_ordinalo", new Date("2026-09-25"))
    expect(free).toMatchObject({ plan: "free", feedbackCount: 100, feedbackLimit: 100, analysesLimit: 3 })
  })
})
