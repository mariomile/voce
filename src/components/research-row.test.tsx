import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { ResearchSummary } from "@/lib/data"
import { ResearchRow } from "./research-row"

// One row of /research: the number of feedback, the question as a link, and its state.
const research: ResearchSummary = {
  id: "11111111-1111-4111-8111-111111111111",
  question: "Perché i team piccoli non passano a Pro?",
  formEnabled: true,
  feedbackCount: 37,
  themeCount: 0,
  hypotheses: { total: 0, confirmed: 0, refuted: 0, toReview: 0 },
  newFeedback: 0,
  lastActivity: "2026-09-28T10:00:00Z",
}

const render = (overrides: Partial<ResearchSummary> = {}) =>
  renderToStaticMarkup(<ResearchRow research={{ ...research, ...overrides }} />)

// The state line, as text.
const state = (html: string) => html.match(/<p[^>]*>([^<]*)<\/p>/)?.[1].replaceAll("&#x27;", "'") ?? null

describe("ResearchRow", () => {
  it("shows the count and the question as a link to the Research", () => {
    const html = render()
    expect(html).toContain(">37<")
    expect(html).toContain(">feedback<")
    expect(html).toMatch(
      /<a[^>]*href="\/research\/11111111-1111-4111-8111-111111111111"[^>]*>Perché i team piccoli non passano a Pro\?<\/a>/
    )
    expect(state(html)).toBeNull()
  })

  it("without feedback says Nessun feedback ancora instead of the number", () => {
    const html = render({ feedbackCount: 0 })
    expect(state(html)).toBe("Nessun feedback ancora")
    expect(html).not.toContain(">0<")
  })

  it("says Modulo spento when the form is off", () => {
    expect(state(render({ formEnabled: false }))).toBe("Modulo spento")
    expect(state(render({ feedbackCount: 0, formEnabled: false }))).toBe("Nessun feedback ancora · Modulo spento")
  })

  it("shows the count, the question as a link and each state of DESIGN.md, only the non-zero verdict parts", () => {
    expect(
      state(render({ themeCount: 5, hypotheses: { total: 2, confirmed: 1, refuted: 0, toReview: 1 }, newFeedback: 6 }))
    ).toBe("5 temi · 2 ipotesi: 1 confermata, 1 da rivedere · 6 feedback nuovi da analizzare")
    expect(state(render({ themeCount: 3, formEnabled: false }))).toBe("3 temi · Modulo spento")
    expect(state(render({ themeCount: 1, hypotheses: { total: 3, confirmed: 2, refuted: 1, toReview: 0 } }))).toBe(
      "1 tema · 3 ipotesi: 2 confermate, 1 smentita"
    )
    // Hypotheses without a verdict yet: the number alone.
    expect(state(render({ hypotheses: { total: 1, confirmed: 0, refuted: 0, toReview: 0 }, newFeedback: 1 }))).toBe(
      "1 ipotesi · 1 feedback nuovo da analizzare"
    )
  })

  it("shows the question as text, never as HTML", () => {
    const html = render({ question: "<b>grassetto</b>?" })
    expect(html).toContain("&lt;b&gt;grassetto&lt;/b&gt;?")
  })
})
