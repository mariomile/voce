import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Hypothesis, Verdict } from "@/lib/data"

// The actions write to the database: here the section only renders.
vi.mock("@/app/(app)/research/[id]/actions", () => ({
  synthesize: vi.fn(),
  addHypothesis: vi.fn(),
  updateHypothesis: vi.fn(),
  deleteHypothesis: vi.fn(),
}))
// S6 lives in the Sintesi's shared state: here it is set by the test.
const outcome = vi.hoisted(() => ({ failed: false }))
vi.mock("./synthesis-outcome", () => ({ useVerdictFailure: () => ({ failed: outcome.failed, setFailed: () => {} }) }))
const { HypothesisList, FailureNote, looksLikeTwoClaims } = await import("./hypothesis-list")
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

describe("looksLikeTwoClaims", () => {
  it("spots a hypothesis that joins a claim and its negation", () => {
    expect(looksLikeTwoClaims("Le grandi aziende restano su Jira per compliance e audit, non per scelta")).toBe(true)
    expect(looksLikeTwoClaims("Restano per compliance e non per scelta")).toBe(true)
    expect(looksLikeTwoClaims("Teams stay for compliance and not because they like it")).toBe(true)
    expect(looksLikeTwoClaims("Jira è troppo lento e complesso per i team piccoli")).toBe(false)
    expect(looksLikeTwoClaims("Il prezzo non frena i team piccoli")).toBe(false)
  })
})

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
    expect(html).toContain("Una sola affermazione per ipotesi, che si può confermare o smentire.")
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
    const sign = (icon: string, word: string) =>
      new RegExp(`<span aria-hidden="true"[^>]*><svg[^>]*lucide-${icon}[\\s\\S]*?</span>[\\s\\S]*?<p[^>]*>${word}</p>`)
    expect(render([withVerdict({})])).toMatch(sign("check", "Confermata"))
    expect(render([withVerdict({ verdict: "refuted" })])).toMatch(sign("x", "Smentita"))
    expect(render([withVerdict({ verdict: "to_review" })])).toMatch(sign("circle-question-mark", "Da rivedere"))
  })

  it("sums up the verdicts next to the title, with the words of the list of Research", () => {
    const html = render([withVerdict({}), { ...hypothesis(2), verdict: { ...confirmed, verdict: "refuted" } }, hypothesis(3)])
    expect(html).toContain("3 ipotesi: 1 confermata, 1 smentita")
    expect(render([hypothesis(1)])).not.toContain("1 ipotesi:")
  })

  it("shows the first quote for and against, the others behind a button that says how many", () => {
    const html = render([withVerdict({})])
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*>Mostra altre 3 citazioni<\/button>/)
    // The others are on the page, hidden until asked.
    expect(html.match(/<div id="[^"]*-more-quotes[^"]*" hidden="">/g)).toHaveLength(2)
    expect(render([withVerdict({ quotesFor: [quote(1), quote(2)], quotesAgainst: [] })])).toContain(">Mostra un&#x27;altra citazione<")
    expect(render([withVerdict({ quotesFor: [quote(1)], quotesAgainst: [quote(4)] })])).not.toContain("Mostra")
  })

  it("step: the number of the section in a Research without feedback, and facoltative while empty", () => {
    const html = renderToStaticMarkup(<HypothesisList researchId={RESEARCH} hypotheses={[]} step={1} />)
    expect(html).toMatch(/<h2[^>]*><span aria-hidden="true"[^>]*>1<\/span>Ipotesi<\/h2>/)
    expect(html).toContain(">facoltative<")
  })

  it("shows the word, counts from verdict_feedback and the read count, the reasoning, up to 3 for and 2 against with channel and date and no customer name", () => {
    const html = render([withVerdict({})])
    // Totals of every linked feedback; the quotes under them are examples.
    expect(html).toContain("18 feedback a favore · 3 contro · su 37 letti")
    expect(html).toContain("Chi ha 2-3 persone trova il costo per utente sproporzionato.")
    expect(html).toContain(">Alcuni a favore<")
    expect(html).toContain(">Alcuni contro<")
    expect(html.match(/<blockquote/g)).toHaveLength(5)
    expect(html).toContain("<mark>pagare a testa</mark>")
    expect(html).toContain("Intervista, 1 ottobre")
    expect(html).toContain("Modulo pubblico, 4 ottobre")
    expect(html).not.toContain("Nessun verdetto ancora")
  })

  it("without quotes on one side there is no heading for it", () => {
    const html = render([withVerdict({ contradicting: 0, quotesAgainst: [] })])
    expect(html).toContain(">Alcuni a favore<")
    expect(html).not.toContain(">Alcuni contro<")
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

  describe("Solo il verdetto", () => {
    const note = "Userai 1 delle 3 analisi di ottobre."
    const renderWith = (hypotheses: Hypothesis[], feedbackSinceThemes: number | null, limitNote?: string) =>
      renderToStaticMarkup(
        <HypothesisList researchId={RESEARCH} hypotheses={hypotheses} verdictOnly={{ feedbackSinceThemes, note, limitNote }} />
      )
    const second = { ...hypothesis(2), verdict: confirmed }

    it("shows only when a hypothesis lacks a verdict or has newer feedback and nothing is newer than the last themes analysis", () => {
      // A hypothesis without a verdict: every hypothesis is redone, so the label counts them all.
      const html = renderWith([hypothesis(1), second], 0)
      expect(html).toContain(">Solo il verdetto di 2 ipotesi<")
      expect(html).toContain(note)
      expect(renderWith([withVerdict({ arrivedAfterVerdict: 2 })], 0)).toContain(">Solo il verdetto di 1 ipotesi<")
      // Every verdict up to date.
      expect(renderWith([withVerdict({}), second], 0)).not.toContain("Solo il verdetto")
      // Feedback arrived after the last themes analysis: the whole analysis is due.
      expect(renderWith([hypothesis(1)], 3)).not.toContain("Solo il verdetto")
      // No themes analysis yet.
      expect(renderWith([hypothesis(1)], null)).not.toContain("Solo il verdetto")
      // Not in the Sintesi without feedback.
      expect(render([hypothesis(1)])).not.toContain("Solo il verdetto")
    })

    it("comes after Aggiungi l'ipotesi, as a secondary button", () => {
      const html = renderWith([hypothesis(1)], 0)
      expect(html.indexOf("Aggiungi l&#x27;ipotesi")).toBeLessThan(html.indexOf("Solo il verdetto"))
    })

    it("Solo il verdetto off with the same note", () => {
      const limit = "Hai usato le 3 analisi di ottobre."
      const html = renderWith([hypothesis(1)], 0, limit)
      expect(html).toMatch(/<button[^>]*aria-disabled="true"[^>]*>Solo il verdetto di 1 ipotesi</)
      expect(html).toContain(limit)
      expect(html).not.toContain(note)
    })
  })

  it("S6 sends the PM to Solo il verdetto only when the button is there, otherwise to the next analysis", () => {
    outcome.failed = true
    try {
      const verdictOnly = { feedbackSinceThemes: 0, note: "Userai 1 delle 3 analisi di ottobre." }
      const withButton = renderToStaticMarkup(
        <HypothesisList researchId={RESEARCH} hypotheses={[hypothesis(1)]} verdictOnly={verdictOnly} />
      )
      expect(withButton).toContain("Solo il verdetto di 1 ipotesi")
      expect(withButton).toContain(
        "Il verdetto non è arrivato e non conta nel limite del mese: le ipotesi mostrano ancora il verdetto precedente. Riprova con «Solo il verdetto»."
      )

      // Every verdict up to date and no feedback after them: no button, so S6 cannot point to it.
      const withoutButton = renderToStaticMarkup(
        <HypothesisList researchId={RESEARCH} hypotheses={[withVerdict({})]} verdictOnly={verdictOnly} />
      )
      expect(withoutButton).not.toContain("Solo il verdetto di")
      expect(withoutButton).not.toContain("Riprova con «Solo il verdetto»")
      expect(withoutButton).toContain(
        "Il verdetto non è arrivato e non conta nel limite del mese: le ipotesi mostrano ancora il verdetto precedente. Arriva con la prossima analisi."
      )
    } finally {
      outcome.failed = false
    }
  })
})
