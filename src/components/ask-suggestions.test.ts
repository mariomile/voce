import { describe, expect, it } from "vitest"
import { createTranslator } from "use-intl/core"
import { messages } from "@/i18n/messages/index"
import { translator } from "@/test/next-intl"
import { followUps, shorten, suggestQuestions, type AskTopics } from "./ask-suggestions"

const t = translator("ask")
const en = createTranslator({ locale: "en", timeZone: "Europe/Rome", messages: messages.en, namespace: "ask" })

const topics: AskTopics = {
  hypotheses: [
    { text: "Jira è troppo lento per i team piccoli", verdict: "confirmed" },
    { text: "La roadmap vive fuori da Jira", verdict: null },
    { text: "Le grandi aziende restano per compliance", verdict: "refuted" },
  ],
  themes: [
    { title: "Interfaccia complessa per utenti non tecnici", kind: "problem" },
    { title: "Integrazione con GitHub", kind: "opportunity" },
    { title: "Jira affidabile per gli sprint", kind: "praise" },
    { title: "Prezzi alti", kind: "problem" },
  ],
}

describe("suggestQuestions", () => {
  it("two hypotheses first, then the biggest themes, four in all, each from a fixed template", () => {
    expect(suggestQuestions(t, topics)).toEqual([
      { question: "Chi smentisce «Jira è troppo lento per i team piccoli», e perché?", source: "hypothesis" },
      { question: "Chi conferma e chi smentisce «La roadmap vive fuori da Jira»?", source: "hypothesis" },
      { question: "Cosa chiedono i clienti per risolvere «Interfaccia complessa per utenti non tecnici»?", source: "theme" },
      { question: "Cosa chiedono esattamente su «Integrazione con GitHub»?", source: "theme" },
    ])
  })

  it("a refuted hypothesis asks who still holds it; a praise theme asks what they like", () => {
    const questions = suggestQuestions(t, { hypotheses: topics.hypotheses.slice(2), themes: topics.themes.slice(2, 3) })
    expect(questions.map((s) => s.question)).toEqual([
      "Chi conferma ancora «Le grandi aziende restano per compliance», e perché?",
      "Cosa apprezzano i clienti in «Jira affidabile per gli sprint»?",
    ])
  })

  it("with few hypotheses the themes fill the rest", () => {
    expect(suggestQuestions(t, { hypotheses: [], themes: topics.themes }).map((s) => s.source)).toEqual([
      "theme",
      "theme",
      "theme",
      "theme",
    ])
  })

  it("no themes and no hypotheses: three starters that fit any Research", () => {
    expect(suggestQuestions(t, { hypotheses: [], themes: [] })).toEqual([
      { question: "Cosa chiedono più spesso i clienti?", source: "starter" },
      { question: "Di cosa si lamentano di più i clienti?", source: "starter" },
      { question: "Cosa apprezzano di più i clienti?", source: "starter" },
    ])
  })

  it("in English", () => {
    expect(suggestQuestions(en, { hypotheses: topics.hypotheses.slice(0, 1), themes: topics.themes.slice(0, 1) })).toEqual([
      { question: "Who disagrees that “Jira è troppo lento per i team piccoli”, and why?", source: "hypothesis" },
      { question: "What do customers ask for to fix “Interfaccia complessa per utenti non tecnici”?", source: "theme" },
    ])
  })

  it("a long hypothesis is cut on a word with an ellipsis, and every question fits the 300 characters", () => {
    const long = `${"parola ".repeat(80)}fine`
    const [first] = suggestQuestions(t, { hypotheses: [{ text: long, verdict: null }], themes: [] })
    expect(first.question.length).toBeLessThanOrEqual(300)
    expect(first.question).toMatch(/^Chi conferma e chi smentisce «(parola )+parola…»\?$/)
  })

  it("the same question twice shows once", () => {
    const twice = suggestQuestions(t, { hypotheses: [], themes: [topics.themes[1], topics.themes[1]] })
    expect(twice).toHaveLength(1)
  })
})

describe("shorten", () => {
  it("leaves a short text alone and cuts a long one on a word", () => {
    expect(shorten("breve", 10)).toBe("breve")
    expect(shorten("una frase che è troppo lunga", 14)).toBe("una frase che…")
    expect(shorten("una frase, poi altro", 10)).toBe("una frase…")
  })
})

describe("followUps", () => {
  const answered = {
    outcome: "answered" as const,
    question: "Chi resta su Jira per compliance?",
    answer: "Per audit.",
    feedbackCount: 3,
    feedbackConsidered: 200,
    feedbackTotal: 200,
    quotes: [{ text: "Siamo una banca. Serve tracciabilità.", highlight: "Serve tracciabilità.", channel: "Supporto", receivedAt: "2026-08-18" }],
  }

  it("suggest, opposite, and who else says the first key phrase: they fill the field, they do not send", () => {
    expect(followUps(t, answered)).toEqual([
      { label: "Cosa propongono?", question: "Su «Chi resta su Jira per compliance?»: cosa propongono i clienti come soluzione?" },
      { label: "Chi dice il contrario?", question: "Su «Chi resta su Jira per compliance?»: chi dice il contrario, e perché?" },
      { label: "Chi altro lo dice?", question: "Quanti altri clienti dicono che «Serve tracciabilità»?" },
    ])
  })

  it("no quotes: no 'who else'", () => {
    expect(followUps(t, { ...answered, quotes: [] }).map((f) => f.label)).toEqual(["Cosa propongono?", "Chi dice il contrario?"])
  })

  it("a long question still makes follow-ups within 300 characters", () => {
    const question = "q".repeat(300)
    for (const f of followUps(t, { ...answered, question, quotes: [{ ...answered.quotes[0], highlight: "h ".repeat(200) }] }))
      expect(f.question.length).toBeLessThanOrEqual(300)
  })

  it("no evidence: none, the entry offers to rewrite the question instead", () => {
    expect(followUps(t, { outcome: "no_evidence", question: "E la privacy?", feedbackConsidered: 200, feedbackTotal: 200 })).toEqual([])
  })
})
