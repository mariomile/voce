import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The button calls a server action: here it only renders.
vi.mock("@/app/(app)/research/[id]/actions", () => ({ synthesize: vi.fn() }))
const { AnalyzeButton, resultMessage } = await import("./analyze-button")
const { translator } = await import("@/test/next-intl")

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

describe("resultMessage", () => {
  const t = translator("research.synthesis.analyze") as Parameters<typeof resultMessage>[0]
  const done = { ok: true as const, themes: "done" as const, themeCount: 4, verdict: "skipped" as const, verdicts: { confirmed: 0, refuted: 0, toReview: 0 }, previousThemesDate: null }

  it("themes done: the announcement with the themes", () => {
    expect(resultMessage(t, done, "it")).toEqual({ text: "Analisi finita: 4 temi.", problem: false })
  })

  it("themes fail and verdict succeeds: S5 with the day of the themes that stay", () => {
    const result = { ...done, themes: "failed" as const, themeCount: 0, verdict: "done" as const, verdicts: { confirmed: 1, refuted: 0, toReview: 1 }, previousThemesDate: "2026-10-08" }
    expect(resultMessage(t, result, "it")).toEqual({
      text: "I temi non sono stati aggiornati e non contano nel limite del mese: restano quelli del 8 ottobre. Il verdetto delle ipotesi è pronto qui sotto.",
      problem: true,
    })
    expect(resultMessage(t, { ...result, previousThemesDate: null }, "it").text).toBe(
      "I temi non sono arrivati e non contano nel limite del mese. Il verdetto delle ipotesi è pronto qui sotto."
    )
  })

  it("themes and verdicts done: the announcement with the verdicts per word, only the words that occur", () => {
    expect(resultMessage(t, { ...done, verdict: "done" as const, verdicts: { confirmed: 1, refuted: 0, toReview: 1 } }, "it")).toEqual({
      text: "Analisi finita: 4 temi. 2 verdetti: 1 confermata, 1 da rivedere.",
      problem: false,
    })
    expect(resultMessage(t, { ...done, verdict: "done" as const, verdicts: { confirmed: 0, refuted: 3, toReview: 0 } }, "it").text).toBe(
      "Analisi finita: 4 temi. 3 verdetti: 3 smentite."
    )
  })

  it("verdict fails and themes succeed: the announcement only, S6 goes to the Ipotesi section", () => {
    expect(resultMessage(t, { ...done, verdict: "failed" as const }, "it")).toEqual({ text: "Analisi finita: 4 temi.", problem: false })
  })
})
