import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Hypothesis, Verdict } from "@/lib/data"

// The actions write to the database: here the section only renders.
vi.mock("@/app/(app)/research/[id]/actions", () => ({
  addHypothesis: vi.fn(),
  updateHypothesis: vi.fn(),
  deleteHypothesis: vi.fn(),
}))
const { HypothesisList, FailureNote } = await import("./hypothesis-list")
const { translator } = await import("@/test/next-intl")

const RESEARCH = "11111111-1111-4111-8111-111111111111"

function hypothesis(n: number): Hypothesis {
  return { id: `22222222-2222-4222-8222-22222222222${n}`, text: `Ipotesi <b>${n}</b>`, writtenAt: "2026-10-03T09:00:00Z", verdict: null }
}

const quote = (n: number, channel = "Intervista") => ({
  feedbackId: `33333333-3333-4333-8333-33333333333${n}`,
  text: `Siamo in due, pagare a testa non ha senso ${n}.`,
  highlight: "pagare a testa",
  channel,
  receivedAt: `2026-10-0${n}`,
})

const confirmed: Verdict = {
  verdict: "confirmed",
  reasoning: "Chi ha 2-3 persone trova il costo per utente sproporzionato.",
  feedbackRead: 37,
  arrivedAfter: 8,
  supporting: 18,
  contradicting: 3,
  quotesFor: [quote(1), quote(2), quote(3)],
  quotesAgainst: [quote(4, "Modulo pubblico"), quote(5)],
  arrivedAfterVerdict: 0,
}

function withVerdict(verdict: Partial<Verdict>): Hypothesis {
  return { ...hypothesis(1), verdict: { ...confirmed, ...verdict } }
}

const render = (hypotheses: Hypothesis[]) => renderToStaticMarkup(<HypothesisList researchId={RESEARCH} hypotheses={hypotheses} />)

describe("HypothesisList", () => {
  it("empty: one line and Scrivi un'ipotesi, no field yet", () => {
    const html = renderToStaticMarkup(<HypothesisList researchId={RESEARCH} hypotheses={[]} />)
    expect(html).toMatch(/<h2[^>]*>Ipotesi<\/h2>/)
    expect(html).toContain("Hai un&#x27;idea da mettere alla prova? Scrivila come ipotesi: i feedback diranno se la confermano.")
    expect(html).toContain(">Scrivi un&#x27;ipotesi<")
    expect(html).not.toContain("Nuova ipotesi")
  })

  it("each hypothesis is an h3 as text, without a verdict yet, with named Modifica and Elimina; the field follows", () => {
    const html = renderToStaticMarkup(<HypothesisList researchId={RESEARCH} hypotheses={[hypothesis(1), hypothesis(2)]} />)
    expect(html).toMatch(/<h3[^>]*>Ipotesi &lt;b&gt;1&lt;\/b&gt;<\/h3>/)
    expect(html.match(/Nessun verdetto ancora\. Arriva con la prossima analisi\./g)).toHaveLength(2)
    expect(html).toContain('aria-label="Modifica l&#x27;ipotesi: Ipotesi &lt;b&gt;2&lt;/b&gt;"')
    expect(html).toContain('aria-label="Elimina l&#x27;ipotesi: Ipotesi &lt;b&gt;2&lt;/b&gt;"')
    expect(html).toContain(">Nuova ipotesi<")
    expect(html).toContain("Una frase che si può confermare o smentire.")
    expect(html).toContain(">Aggiungi l&#x27;ipotesi<")
    expect(html).not.toContain("Scrivi un&#x27;ipotesi")
  })

  it("5 hypotheses: H3 in place of the field", () => {
    const html = renderToStaticMarkup(
      <HypothesisList researchId={RESEARCH} hypotheses={[1, 2, 3, 4, 5].map(hypothesis)} />
    )
    expect(html).toContain("Questa Research ha già 5 ipotesi, il massimo. Eliminane una per scriverne un&#x27;altra.")
    expect(html).not.toContain("Nuova ipotesi")
  })

  it("the verdict word comes from research.verdict, not from the model, with a decorative sign", () => {
    expect(render([withVerdict({})])).toMatch(/<span aria-hidden="true">✓<\/span> ?Confermata/)
    expect(render([withVerdict({ verdict: "refuted" })])).toMatch(/<span aria-hidden="true">✕<\/span> ?Smentita/)
    expect(render([withVerdict({ verdict: "to_review" })])).toMatch(/<span aria-hidden="true">\?<\/span> ?Da rivedere/)
  })

  it("shows the word, counts from verdict_feedback and the read count, the reasoning, up to 3 for and 2 against with channel and date and no customer name", () => {
    const html = render([withVerdict({})])
    expect(html).toContain("18 a favore · 3 contro · su 37 letti")
    expect(html).toContain("Chi ha 2-3 persone trova il costo per utente sproporzionato.")
    expect(html).toContain(">A favore<")
    expect(html).toContain(">Contro<")
    expect(html.match(/<blockquote/g)).toHaveLength(5)
    expect(html).toContain("<mark>pagare a testa</mark>")
    expect(html).toContain("Intervista, 1 ottobre")
    expect(html).toContain("Modulo pubblico, 4 ottobre")
    expect(html).not.toContain("Nessun verdetto ancora")
  })

  it("without quotes on one side there is no heading for it", () => {
    const html = render([withVerdict({ contradicting: 0, quotesAgainst: [] })])
    expect(html).toContain(">A favore<")
    expect(html).not.toContain(">Contro<")
  })

  it("V1: Dei 37 feedback letti, 8 sono arrivati dopo.", () => {
    expect(render([withVerdict({})])).toContain("Scritta il 3 ottobre. Dei 37 feedback letti, 8 sono arrivati dopo.")
  })

  it("V2 when none arrived after", () => {
    expect(render([withVerdict({ arrivedAfter: 0 })])).toContain(
      "Scritta il 3 ottobre. Tutti i 37 feedback letti erano già arrivati quando l&#x27;hai scritta: il verdetto li rilegge, non la mette alla prova con feedback nuovi."
    )
  })

  it("Dopo questo verdetto sono arrivati {k} feedback., only when k > 0", () => {
    expect(render([withVerdict({ arrivedAfterVerdict: 6 })])).toContain("Dopo questo verdetto sono arrivati 6 feedback.")
    expect(render([withVerdict({ arrivedAfterVerdict: 1 })])).toContain("Dopo questo verdetto è arrivato 1 feedback.")
    expect(render([withVerdict({})])).not.toContain("Dopo questo verdetto")
  })

  it("a reasoning with <b>x</b> and **x** shows those characters", () => {
    const html = render([withVerdict({ reasoning: "Vedi <b>x</b> e **x**." })])
    expect(html).toContain("Vedi &lt;b&gt;x&lt;/b&gt; e **x**.")
    expect(html).not.toContain("<b>x</b>")
  })

  it("no links: Da rivedere, Nessuno dei {n} feedback letti ne parla. and no reasoning", () => {
    const html = render([
      withVerdict({ verdict: "to_review", reasoning: "Ragionamento del modello.", supporting: 0, contradicting: 0, quotesFor: [], quotesAgainst: [] }),
    ])
    expect(html).toContain("Da rivedere")
    expect(html).toContain("Nessuno dei 37 feedback letti ne parla.")
    expect(html).not.toContain("Ragionamento del modello.")
    expect(html).not.toContain("a favore")
  })

  it("busy shows H7", () => {
    const t = translator("research.hypotheses") as Parameters<typeof FailureNote>[0]["t"]
    const html = renderToStaticMarkup(<FailureNote failure="busy" t={t} message="x" />)
    expect(html).toContain("C&#x27;è un&#x27;analisi in corso su questa Research: le ipotesi si cambiano quando è finita.")
  })
})
