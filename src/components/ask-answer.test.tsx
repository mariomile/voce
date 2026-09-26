import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { AskResult } from "@/app/(app)/ask/actions"
import { AskAnswer } from "./ask-answer"

type Answered = Extract<AskResult, { outcome: "answered" }>

const answered = (overrides: Partial<Answered> = {}): Answered => ({
  ok: true,
  outcome: "answered",
  question: "Cosa dicono della banca?",
  answer: "La banca si scollega spesso e va ricollegata a mano.",
  feedbackCount: 2,
  feedbackConsidered: 212,
  feedbackInWindow: 212,
  quotes: [
    { text: "La banca si scollega ogni lunedì.", highlight: "si scollega ogni lunedì", channel: "Supporto", receivedAt: "2026-09-12" },
    { text: "Devo ricollegare la banca ogni settimana.", highlight: "ricollegare la banca", channel: "Call di vendita", receivedAt: "2026-09-03" },
  ],
  usage: { used: 3, quota: 10 },
  ...overrides,
})

const html = (result: Extract<AskResult, { ok: true }>) => renderToStaticMarkup(<AskAnswer result={result} />)
const text = (markup: string) => markup.replace(/<[^>]+>/g, "")

describe("AskAnswer", () => {
  it("shows heading, count, text, quotes with channel and date and the perimeter", () => {
    const markup = html(answered())
    expect(markup).toMatch(/<section aria-labelledby="ask-answer-heading"[^>]*><h2 id="ask-answer-heading"[^>]*>Risposta a «Cosa dicono della banca\?»<\/h2>/)
    expect(text(markup)).toContain("2feedback ne parlano")
    expect(markup).toContain("La banca si scollega spesso e va ricollegata a mano.")
    expect(markup.match(/<blockquote/g)).toHaveLength(2)
    expect(markup.indexOf("si scollega ogni lunedì")).toBeLessThan(markup.indexOf("ricollegare la banca"))
    expect(markup).toContain("<mark>si scollega ogni lunedì</mark>")
    expect(markup).toContain("Supporto, 12 settembre</cite>")
    expect(markup).toContain("Call di vendita, 3 settembre</cite>")
    expect(text(markup)).toContain("Cosa hanno scritto")
    expect(text(markup)).toContain(
      "Letti 212 feedback degli ultimi 90 giorni. La risposta non resta su questa pagina: se ti serve, copiala."
    )
  })

  it("one feedback: feedback ne parla", () => {
    const markup = html(answered({ feedbackCount: 1, quotes: answered().quotes.slice(0, 1) }))
    expect(text(markup)).toContain("1feedback ne parla")
    expect(text(markup)).not.toContain("ne parlano")
  })

  it("more linked feedback than quotes: Cosa hanno scritto: k dei n feedback", () => {
    expect(text(html(answered({ feedbackCount: 23 })))).toContain("Cosa hanno scritto: 2 dei 23 feedback")
  })

  it("over 500 feedback in the window: the partial perimeter", () => {
    expect(text(html(answered({ feedbackConsidered: 500, feedbackInWindow: 740 })))).toContain(
      "Letti i 500 feedback più recenti degli ultimi 90 giorni, su 740: i più vecchi non entrano nella risposta. La risposta non resta su questa pagina: se ti serve, copiala."
    )
  })

  it("no customer name in quotes: the result carries none and the markup shows channel and date only", () => {
    const markup = html(answered())
    expect(Object.keys(answered().quotes[0]).sort()).toEqual(["channel", "highlight", "receivedAt", "text"])
    expect(markup.match(/<cite[^>]*>([^<]*)<\/cite>/g)).toEqual([
      expect.stringContaining(">Supporto, 12 settembre</cite>"),
      expect.stringContaining(">Call di vendita, 3 settembre</cite>"),
    ])
  })

  it("no_evidence shows the sentence without number, text or quotes", () => {
    const markup = html({
      ok: true,
      outcome: "no_evidence",
      question: "Cosa dicono della privacy?",
      feedbackConsidered: 212,
      feedbackInWindow: 212,
      usage: { used: 3, quota: 10 },
    })
    expect(markup).toContain("Risposta a «Cosa dicono della privacy?»")
    expect(text(markup)).toContain("Non trovo feedback che ne parlano.")
    expect(text(markup)).toContain(
      "Letti 212 feedback degli ultimi 90 giorni. Prova con altre parole, per esempio il nome della funzione come lo scrivono i clienti."
    )
    expect(markup).not.toContain("<blockquote")
    expect(markup).not.toContain("ne parlano</")
    expect(markup).not.toMatch(/>\d+</)
  })

  it("model markup is shown as text", () => {
    const markup = html(answered({ answer: "Dicono <b>x</b> e **y**.", question: "<i>domanda</i>" }))
    expect(markup).toContain("Dicono &lt;b&gt;x&lt;/b&gt; e **y**.")
    expect(markup).toContain("Risposta a «&lt;i&gt;domanda&lt;/i&gt;»")
    expect(markup).not.toContain("<b>x</b>")
  })
})
