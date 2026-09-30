import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { AskAnswered, AskOutcome } from "./ask-format"
import { AskAnswer } from "./ask-answer"

const long = `Uso Fatturino da due anni per lo studio. ${"Ogni mese preparo le fatture e le mando. ".repeat(4)}La banca si scollega ogni lunedì e devo ricollegarla. Poi riparto.`

const answered = (overrides: Partial<AskAnswered> = {}): AskAnswered => ({
  outcome: "answered",
  question: "Cosa dicono della banca?",
  answer: "La banca si scollega spesso e va ricollegata a mano. Succede soprattutto il lunedì.",
  feedbackCount: 2,
  feedbackConsidered: 212,
  feedbackTotal: 212,
  quotes: [
    { text: long, highlight: "La banca si scollega ogni lunedì", channel: "Supporto", receivedAt: "2026-09-12" },
    { text: "Devo ricollegare la banca ogni settimana.", highlight: "ricollegare la banca", channel: "Call di vendita", receivedAt: "2026-09-03" },
  ],
  ...overrides,
})

const html = (result: AskOutcome, props: { latest?: boolean; canFollowUp?: boolean } = {}) =>
  renderToStaticMarkup(<AskAnswer result={result} onFollowUp={() => {}} {...props} />)
const text = (markup: string) => markup.replace(/<[^>]+>/g, "")

describe("AskAnswer, the latest answer", () => {
  it("a region named after the question, the question as its title, and Copia", () => {
    const markup = html(answered())
    expect(markup).toMatch(/^<section aria-label="Risposta a «Cosa dicono della banca\?»"/)
    expect(markup).toMatch(/<h2[^>]*>Cosa dicono della banca\?<\/h2>/)
    expect(markup).toMatch(/<button[^>]*>.*Copia<\/button>/)
  })

  it("the count with how many were read, the first sentence large and the rest under it", () => {
    const markup = html(answered())
    expect(text(markup)).toContain("2feedback ne parlanosu 212 letti")
    expect(markup).toMatch(/<p class="[^"]*text-3xl[^"]*">La banca si scollega spesso e va ricollegata a mano\.<\/p>/)
    expect(markup).toMatch(/<p class="[^"]*text-ink-muted[^"]*">Succede soprattutto il lunedì\.<\/p>/)
  })

  it("a long feedback shows its key phrase and opens to the whole text; a short one shows whole", () => {
    const markup = html(answered())
    expect(markup.match(/<blockquote/g)).toHaveLength(2)
    expect(text(markup)).toContain("“…La banca si scollega ogni lunedì…”")
    expect(markup).not.toContain("Uso Fatturino da due anni")
    expect(markup.match(/aria-expanded="false"[^>]*>Leggi tutto il feedback</g)).toHaveLength(1)
    expect(markup).toContain("Devo <mark>ricollegare la banca</mark> ogni settimana.")
    expect(markup).toContain("<mark>La banca si scollega ogni lunedì</mark>")
  })

  it("each quote shows channel and date, never a customer name", () => {
    expect(Object.keys(answered().quotes[0]).sort()).toEqual(["channel", "highlight", "receivedAt", "text"])
    expect(html(answered()).match(/<cite[^>]*>([^<]*)<\/cite>/g)).toEqual([
      expect.stringContaining(">Supporto, 12 settembre</cite>"),
      expect.stringContaining(">Call di vendita, 3 settembre</cite>"),
    ])
  })

  it("Cosa hanno scritto, with k of n when the model linked more feedback than it quoted", () => {
    expect(text(html(answered()))).toContain("Cosa hanno scritto")
    expect(text(html(answered({ feedbackCount: 23 })))).toContain("Cosa hanno scritto: 2 dei 23 feedback")
  })

  it("one feedback: feedback ne parla", () => {
    const markup = text(html(answered({ feedbackCount: 1, quotes: answered().quotes.slice(1) })))
    expect(markup).toContain("1feedback ne parla")
    expect(markup).not.toContain("ne parlano")
  })

  it("the follow-ups, and none when the month's questions are used up", () => {
    expect(text(html(answered()))).toContain("ApprofondisciCosa propongono?Chi dice il contrario?Chi altro lo dice?")
    expect(text(html(answered(), { canFollowUp: false }))).not.toContain("Approfondisci")
  })

  it("over 500 feedback in the Research: the partial perimeter", () => {
    expect(text(html(answered({ feedbackConsidered: 500, feedbackTotal: 740 })))).toContain(
      "Letti i 500 feedback più recenti di questa Research, su 740: i più vecchi non entrano nella risposta."
    )
  })

  it("no_evidence shows the sentence and offers to rewrite, without number, text or quotes", () => {
    const markup = html({ outcome: "no_evidence", question: "Cosa dicono della privacy?", feedbackConsidered: 212, feedbackTotal: 212 })
    expect(markup).toContain("Risposta a «Cosa dicono della privacy?»")
    expect(text(markup)).toContain("Non trovo feedback che ne parlano.")
    expect(text(markup)).toContain(
      "Letti 212 feedback di questa Research. Prova con altre parole, per esempio il nome della funzione come lo scrivono i clienti."
    )
    expect(text(markup)).toContain("Riscrivi la domanda")
    expect(markup).not.toContain("<blockquote")
    expect(markup).not.toMatch(/>\d+</)
  })

  it("model markup is shown as text", () => {
    const markup = html(answered({ answer: "Dicono <b>x</b> e **y**.", question: "<i>domanda</i>" }))
    expect(markup).toContain("Dicono &lt;b&gt;x&lt;/b&gt; e **y**.")
    expect(markup).toContain("Risposta a «&lt;i&gt;domanda&lt;/i&gt;»")
    expect(markup).not.toContain("<b>x</b>")
  })
})

describe("AskAnswer, an earlier answer", () => {
  it("folds into one line: the count, the question and the first sentence, in a button that opens it", () => {
    const markup = html(answered(), { latest: false })
    expect(markup).toMatch(/<h2><button[^>]*aria-expanded="false"/)
    expect(text(markup)).toContain("2Cosa dicono della banca?La banca si scollega spesso e va ricollegata a mano.")
    expect(markup).not.toContain("<blockquote")
    expect(markup).not.toContain("Copia")
  })

  it("an earlier no_evidence says so in its line", () => {
    const markup = html({ outcome: "no_evidence", question: "E la privacy?", feedbackConsidered: 212, feedbackTotal: 212 }, { latest: false })
    expect(text(markup)).toContain("0E la privacy?Non trovo feedback che ne parlano.")
  })
})
