import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The button calls a server action: here it only renders.
vi.mock("@/app/(app)/research/[id]/actions", () => ({ synthesize: vi.fn() }))
const { AnalyzeButton } = await import("./analyze-button")

const ID = "11111111-1111-4111-8111-111111111111"

describe("AnalyzeButton", () => {
  it("full perimeter: Analizza {n} feedback, with the cost note", () => {
    const html = renderToStaticMarkup(
      <AnalyzeButton researchId={ID} count={37} total={37} notes={["Userai 1 delle 3 analisi di ottobre."]} />
    )
    expect(html).toContain(">Analizza 37 feedback<")
    expect(html).toContain("Userai 1 delle 3 analisi di ottobre.")
    expect(html).not.toContain("di questa Research")
    expect(html).not.toContain(`aria-disabled="true"`)
  })

  it("partial perimeter: the label and the note carry n from the server and the Research total", () => {
    const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={250} total={612} notes={[]} />)
    expect(html).toContain(">Analizza i 250 feedback più recenti<")
    expect(html).toContain("su 612 di questa Research")
  })

  it("analyses used up: aria-disabled, not disabled, with the note of the plan", () => {
    const note = "Hai usato le 3 analisi di ottobre."
    const html = renderToStaticMarkup(
      <AnalyzeButton researchId={ID} count={37} total={37} notes={["Userai 1 delle 3 analisi di ottobre."]} limitNote={note} />
    )
    expect(html).toMatch(/<button[^>]*aria-disabled="true"/)
    expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
    expect(html).toContain(note)
    expect(html).not.toContain("Userai 1")
  })
})
