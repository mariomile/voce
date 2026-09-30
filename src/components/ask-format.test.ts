import { describe, expect, it } from "vitest"
import { createTranslator } from "use-intl/core"
import { messages } from "@/i18n/messages/index"
import { translator } from "@/test/next-intl"
import { answerAsText, compactQuote, progressStep, sharePercent, splitAnswer } from "./ask-format"

const t = translator("ask")
const en = createTranslator({ locale: "en", timeZone: "Europe/Rome", messages: messages.en, namespace: "ask" })

const answered = {
  outcome: "answered" as const,
  question: "Chi resta su Jira per compliance?",
  answer: "Restano per audit e tracciabilità. Pesano anche i permessi.",
  feedbackCount: 16,
  feedbackConsidered: 200,
  feedbackTotal: 200,
  quotes: [
    { text: "Siamo una banca. Tracciabilità di ogni modifica, workflow di approvazione.", highlight: "Tracciabilità di ogni modifica", channel: "Supporto", receivedAt: "2026-08-18" },
    { text: "Jira me lo dà.", highlight: "Jira me lo dà.", channel: "Intervista", receivedAt: "2026-09-18" },
  ],
}

describe("splitAnswer", () => {
  it("the first sentence leads, the rest follows", () => {
    expect(splitAnswer("Restano per audit e tracciabilità. Pesano anche i permessi.")).toEqual({
      lead: "Restano per audit e tracciabilità.",
      rest: "Pesano anche i permessi.",
    })
  })

  it("one sentence is all lead", () => {
    expect(splitAnswer("Chiedono l'export in Excel.")).toEqual({ lead: "Chiedono l'export in Excel.", rest: "" })
  })

  it("does not split on a number or an abbreviation followed by lowercase", () => {
    expect(splitAnswer("Costa 1.5 volte tanto, per es. nei team grandi. Poi altro.")).toEqual({
      lead: "Costa 1.5 volte tanto, per es. nei team grandi.",
      rest: "Poi altro.",
    })
  })

  it("question and exclamation marks end a sentence too, and spaces are trimmed", () => {
    expect(splitAnswer("  Perché? Perché costa troppo!  ")).toEqual({ lead: "Perché?", rest: "Perché costa troppo!" })
  })
})

describe("compactQuote", () => {
  const long = `${"Prima parte del feedback molto lunga. ".repeat(5)}La frase chiave. ${"E poi il resto del feedback. ".repeat(4)}`.trim()

  it("a long feedback shows only its key phrase, and the ellipses say it was cut", () => {
    expect(compactQuote(long, "La frase chiave")).toEqual({ before: "…", highlight: "La frase chiave", after: "…", shortened: true })
  })

  it("a key phrase that ends its sentence takes no ellipsis after it: the one before says it was cut", () => {
    expect(compactQuote(long, "La frase chiave.")).toMatchObject({ before: "…", after: "" })
  })

  it("no ellipsis on the side where the key phrase touches the edge", () => {
    const text = `La frase chiave all'inizio, ${"resto. ".repeat(40)}`.trim()
    expect(compactQuote(text, "La frase chiave all'inizio")).toMatchObject({ before: "", after: "…", shortened: true })
  })

  it("a short feedback shows whole, with the key phrase marked", () => {
    expect(compactQuote("Siamo una banca. Tracciabilità di ogni modifica.", "Tracciabilità di ogni modifica")).toEqual({
      before: "Siamo una banca. ",
      highlight: "Tracciabilità di ogni modifica",
      after: ".",
      shortened: false,
    })
  })

  it("a key phrase not in the text: the whole text, nothing marked", () => {
    expect(compactQuote("Testo intero.", "altro")).toEqual({ before: "Testo intero.", highlight: "", after: "", shortened: false })
  })
})

describe("sharePercent", () => {
  it("whole percent of the feedback read", () => {
    expect(sharePercent(16, 200)).toBe("8%")
    expect(sharePercent(1, 3)).toBe("33%")
    expect(sharePercent(2, 3)).toBe("67%")
    expect(sharePercent(200, 200)).toBe("100%")
  })

  it("under 1% but more than 0 reads <1%", () => {
    expect(sharePercent(1, 1000)).toBe("<1%")
    expect(sharePercent(4, 1000)).toBe("<1%")
    expect(sharePercent(9, 1000)).toBe("<1%")
    expect(sharePercent(10, 1000)).toBe("1%")
  })

  it("no feedback mentions it, or none was read: no percentage", () => {
    expect(sharePercent(0, 200)).toBeNull()
    expect(sharePercent(0, 0)).toBeNull()
    expect(sharePercent(3, 0)).toBeNull()
  })
})

describe("progressStep", () => {
  it("reads, then searches, then checks the quotes until the answer arrives", () => {
    expect(progressStep(0)).toBe(0)
    expect(progressStep(1_499)).toBe(0)
    expect(progressStep(1_500)).toBe(1)
    expect(progressStep(5_999)).toBe(1)
    expect(progressStep(6_000)).toBe(2)
    expect(progressStep(60_000)).toBe(2)
  })
})

describe("answerAsText", () => {
  it("question, count, answer and each quote with channel and date, as plain text", () => {
    expect(answerAsText(t, answered, "it")).toBe(
      [
        "Domanda: Chi resta su Jira per compliance?",
        "",
        "16 feedback ne parlano, su 200 letti.",
        "",
        "Restano per audit e tracciabilità. Pesano anche i permessi.",
        "",
        "Cosa hanno scritto:",
        "- “…Tracciabilità di ogni modifica…” (Supporto, 18 agosto)",
        "- “Jira me lo dà.” (Intervista, 18 settembre)",
      ].join("\n")
    )
  })

  it("a key phrase that ends its sentence inside a longer feedback: the ellipsis only before it", () => {
    const quote = { text: "Siamo una banca. Serve tracciabilità. E altro.", highlight: "Serve tracciabilità.", channel: "Supporto", receivedAt: "2026-08-18" }
    expect(answerAsText(t, { ...answered, quotes: [quote] }, "it")).toContain("- “…Serve tracciabilità.” (Supporto, 18 agosto)")
  })

  it("in English", () => {
    expect(answerAsText(en, answered, "en")).toBe(
      [
        "Question: Chi resta su Jira per compliance?",
        "",
        "16 feedback mention it, out of 200 read.",
        "",
        "Restano per audit e tracciabilità. Pesano anche i permessi.",
        "",
        "What they wrote:",
        "- “…Tracciabilità di ogni modifica…” (Supporto, August 18)",
        "- “Jira me lo dà.” (Intervista, September 18)",
      ].join("\n")
    )
  })

  it("no evidence: the question and that nothing mentions it", () => {
    expect(
      answerAsText(t, { outcome: "no_evidence", question: "E la privacy?", feedbackConsidered: 200, feedbackTotal: 200 }, "it")
    ).toBe(["Domanda: E la privacy?", "", "Nessun feedback ne parla, su 200 letti."].join("\n"))
  })

  it("one feedback: ne parla", () => {
    expect(answerAsText(t, { ...answered, feedbackCount: 1, quotes: answered.quotes.slice(1) }, "it")).toContain(
      "1 feedback ne parla, su 200 letti."
    )
  })
})
