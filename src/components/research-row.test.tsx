import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ResearchRow } from "./research-row"

// One row of /research: the number of feedback, the question as a link, and its state.
const research = {
  id: "11111111-1111-4111-8111-111111111111",
  question: "Perché i team piccoli non passano a Pro?",
  formEnabled: true,
  feedbackCount: 37,
}

const render = (overrides: Partial<typeof research> = {}) =>
  renderToStaticMarkup(<ResearchRow research={{ ...research, ...overrides }} />)

describe("ResearchRow", () => {
  it("shows the count and the question as a link to the Research", () => {
    const html = render()
    expect(html).toContain(">37<")
    expect(html).toContain(">feedback<")
    expect(html).toMatch(
      /<a[^>]*href="\/research\/11111111-1111-4111-8111-111111111111"[^>]*>Perché i team piccoli non passano a Pro\?<\/a>/
    )
    expect(html).not.toContain("Nessun feedback ancora")
    expect(html).not.toContain("Modulo spento")
  })

  it("without feedback says Nessun feedback ancora instead of the number", () => {
    const html = render({ feedbackCount: 0 })
    expect(html).toContain("Nessun feedback ancora")
    expect(html).not.toContain(">0<")
  })

  it("says Modulo spento when the form is off", () => {
    expect(render({ formEnabled: false })).toContain("Modulo spento")
  })

  it("shows the question as text, never as HTML", () => {
    const html = render({ question: "<b>grassetto</b>?" })
    expect(html).toContain("&lt;b&gt;grassetto&lt;/b&gt;?")
  })
})
