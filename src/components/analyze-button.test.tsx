import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The button calls a server action: here it only renders.
vi.mock("@/app/(app)/research/[id]/actions", () => ({ synthesize: vi.fn() }))
const { AnalyzeButton, resultMessage } = await import("./analyze-button")
const { translator } = await import("@/test/next-intl")

const ID = "11111111-1111-4111-8111-111111111111"

const october = { limit: 3, month: "ottobre", nextMonth: "novembre" }
const quota = (remaining: number) => ({ ...october, remaining })

describe("AnalyzeButton", () => {
  it("full perimeter: Analizza {n} feedback, with the cost note", () => {
    const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={37} total={37} quota={quota(3)} hypothesisCount={0} />)
    expect(html).toContain(">Analizza 37 feedback<")
    expect(html).toContain("Userai 1 delle 3 analisi di ottobre.")
    expect(html).not.toContain("di questa Research")
    expect(html).not.toContain(`aria-disabled="true"`)
  })

  it("nothing new since the last analysis: said first, and the button steps back to secondary", () => {
    const upToDate = "Nessun feedback nuovo dopo l'analisi del 3 ottobre."
    const html = renderToStaticMarkup(
      <AnalyzeButton researchId={ID} count={37} total={37} quota={quota(2)} hypothesisCount={0} upToDate={upToDate} />
    )
    expect(html).toContain("Nessun feedback nuovo dopo l&#x27;analisi del 3 ottobre. · Ti restano 2 analisi di ottobre.")
    expect(html).toMatch(/<button[^>]*class="[^"]*bg-veil[^"]*"[^>]*>Analizza 37 feedback</)
    const fresh = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={37} total={37} quota={quota(2)} hypothesisCount={0} />)
    expect(fresh).toMatch(/<button[^>]*class="[^"]*bg-ink[^"]*"[^>]*>Analizza 37 feedback</)
  })

  it("after the first analysis of the month, without hypotheses: the analyses left", () => {
    const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={37} total={37} quota={quota(2)} hypothesisCount={0} />)
    expect(html).toContain("Ti restano 2 analisi di ottobre.")
  })

  it("with hypotheses the cost is 2 analyses, said before the click", () => {
    for (const remaining of [3, 2]) {
      const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={37} total={37} quota={quota(remaining)} hypothesisCount={2} />)
      expect(html).toContain(">Analizza 37 feedback<")
      expect(html).toContain("Userai 2 delle 3 analisi di ottobre: una per i temi, una per il verdetto delle ipotesi.")
    }
  })

  it("one analysis left with hypotheses: themes-only label and S4", () => {
    const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={37} total={37} quota={quota(1)} hypothesisCount={2} />)
    expect(html).toContain(">Analizza solo i temi di 37 feedback<")
    expect(html).toContain(
      "Ti resta 1 analisi di ottobre: basta per i temi, non per il verdetto, che ne usa un&#x27;altra. Il verdetto delle ipotesi torna disponibile il 1 novembre, o subito con Pro."
    )
    expect(html).not.toContain("Userai")
  })

  it("one analysis left without hypotheses: the usual label", () => {
    const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={37} total={37} quota={quota(1)} hypothesisCount={0} />)
    expect(html).toContain(">Analizza 37 feedback<")
    expect(html).not.toContain("basta per i temi")
  })

  it("partial perimeter: the label and the note carry n from the server and the Research total", () => {
    const html = renderToStaticMarkup(<AnalyzeButton researchId={ID} count={250} total={612} quota={quota(3)} hypothesisCount={0} />)
    expect(html).toContain(">Analizza i 250 feedback più recenti<")
    expect(html).toContain("su 612 di questa Research")
  })

  it("the other notes follow the cost", () => {
    const html = renderToStaticMarkup(
      <AnalyzeButton researchId={ID} count={3} total={3} quota={quota(3)} hypothesisCount={0} notes={["Nota in più."]} />
    )
    expect(html).toContain("Userai 1 delle 3 analisi di ottobre. · Nota in più.")
  })

  it("analyses used up: aria-disabled, not disabled, with the note of the plan", () => {
    const note = "Hai usato le 3 analisi di ottobre."
    const html = renderToStaticMarkup(
      <AnalyzeButton researchId={ID} count={37} total={37} quota={quota(0)} hypothesisCount={2} limitNote={note} />
    )
    expect(html).toMatch(/<button[^>]*aria-disabled="true"/)
    expect(html).not.toMatch(/<button[^>]*\sdisabled=""/)
    expect(html).toContain(note)
    expect(html).not.toContain("Userai")
  })
})

describe("resultMessage", () => {
  const t = translator("research.synthesis.analyze") as Parameters<typeof resultMessage>[0]
  const done = { ok: true as const, themes: "done" as const, themeCount: 4, verdict: "skipped" as const, verdicts: { confirmed: 0, refuted: 0, toReview: 0 }, previousThemesDate: null }

  it("themes done: the announcement with the themes", () => {
    expect(resultMessage(t, done, "it", october)).toEqual({ text: "Analisi finita: 4 temi.", problem: false })
  })

  it("themes fail and verdict succeeds: S5 with the day of the themes that stay", () => {
    const result = { ...done, themes: "failed" as const, themeCount: 0, verdict: "done" as const, verdicts: { confirmed: 1, refuted: 0, toReview: 1 }, previousThemesDate: "2026-10-08" }
    expect(resultMessage(t, result, "it", october)).toEqual({
      text: "I temi non sono stati aggiornati e non contano nel limite del mese: restano quelli del 8 ottobre. Il verdetto delle ipotesi è pronto qui sotto.",
      problem: true,
    })
    expect(resultMessage(t, { ...result, previousThemesDate: null }, "it", october).text).toBe(
      "I temi non sono arrivati e non contano nel limite del mese. Il verdetto delle ipotesi è pronto qui sotto."
    )
  })

  it("themes and verdicts done: the announcement with the verdicts per word, only the words that occur", () => {
    expect(resultMessage(t, { ...done, verdict: "done" as const, verdicts: { confirmed: 1, refuted: 0, toReview: 1 } }, "it", october)).toEqual({
      text: "Analisi finita: 4 temi. 2 verdetti: 1 confermata, 1 da rivedere.",
      problem: false,
    })
    expect(resultMessage(t, { ...done, verdict: "done" as const, verdicts: { confirmed: 0, refuted: 3, toReview: 0 } }, "it", october).text).toBe(
      "Analisi finita: 4 temi. 3 verdetti: 3 smentite."
    )
  })

  it("verdict fails and themes succeed: the announcement only, S6 goes to the Ipotesi section", () => {
    expect(resultMessage(t, { ...done, verdict: "failed" as const }, "it", october)).toEqual({ text: "Analisi finita: 4 temi.", problem: false })
  })

  it("only the themes ran because 1 analysis was left: the announcement and S4", () => {
    expect(resultMessage(t, { ...done, verdict: "limit" as const }, "it", october)).toEqual({
      text: "Analisi finita: 4 temi. Ti resta 1 analisi di ottobre: basta per i temi, non per il verdetto, che ne usa un'altra. Il verdetto delle ipotesi torna disponibile il 1 novembre, o subito con Pro.",
      problem: false,
    })
  })
})
