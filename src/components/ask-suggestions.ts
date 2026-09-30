import type { AskT } from "@/components/ask-copy"
import type { AskOutcome } from "@/components/ask-format"
import type { ThemeKind } from "@/lib/types"

// Questions Voce suggests without calling the model: fixed templates filled with the Research's own
// hypotheses and themes, and follow-ups built from an answer. They fill the field, they never send:
// every question counts toward the month.

export type AskTopics = {
  hypotheses: { text: string; verdict: "confirmed" | "refuted" | "to_review" | null }[]
  // The themes of the last analysis, biggest first.
  themes: { title: string; kind: ThemeKind }[]
}

export type Suggestion = { question: string; source: "hypothesis" | "theme" | "starter" }

const MAX_SUGGESTIONS = 4
const MAX_HYPOTHESES = 2
// Long enough for a real hypothesis or theme title, short enough that every template stays under 300.
const TOPIC_LENGTH = 120

const HYPOTHESIS_TEMPLATE = { confirmed: "hypothesisConfirmed", refuted: "hypothesisRefuted" } as const
const THEME_TEMPLATE = { problem: "themeProblem", opportunity: "themeOpportunity", praise: "themePraise" } as const

// A confirmed hypothesis asks who disagrees, a refuted one who still holds it: the question tests the
// verdict instead of repeating it.
export function suggestQuestions(t: AskT, topics: AskTopics): Suggestion[] {
  const fromHypotheses = topics.hypotheses.slice(0, MAX_HYPOTHESES).map(
    (h): Suggestion => ({
      question: t(`suggest.${h.verdict === "confirmed" || h.verdict === "refuted" ? HYPOTHESIS_TEMPLATE[h.verdict] : "hypothesisOpen"}`, {
        text: shorten(h.text, TOPIC_LENGTH),
      }),
      source: "hypothesis",
    })
  )
  const fromThemes = topics.themes.map(
    (theme): Suggestion => ({
      question: t(`suggest.${THEME_TEMPLATE[theme.kind]}`, { title: shorten(theme.title, TOPIC_LENGTH) }),
      source: "theme",
    })
  )
  const all = [...fromHypotheses, ...fromThemes].filter((s, i, list) => list.findIndex((o) => o.question === s.question) === i)
  if (all.length > 0) return all.slice(0, MAX_SUGGESTIONS)
  return (["starterAsk", "starterProblem", "starterPraise"] as const).map((key) => ({
    question: t(`suggest.${key}`),
    source: "starter" as const,
  }))
}

// "Approfondisci" under an answer: what customers suggest, who says the opposite, and who else says the
// first key phrase. An answer with no evidence has none: it offers to rewrite the question.
export function followUps(t: AskT, result: AskOutcome) {
  if (result.outcome === "no_evidence") return []
  const question = shorten(result.question, 150)
  const items = [
    { label: t("followUp.solutions"), question: t("followUp.solutionsQuestion", { question }) },
    { label: t("followUp.opposite"), question: t("followUp.oppositeQuestion", { question }) },
  ]
  const phrase = result.quotes[0]?.highlight.trim().replace(/[.!?…;:,]+$/, "")
  if (phrase) items.push({ label: t("followUp.others"), question: t("followUp.othersQuestion", { quote: shorten(phrase, 150) }) })
  return items
}

// Cut on a word boundary; the ellipsis says the text was shortened.
export function shorten(text: string, max: number) {
  const clean = text.trim().replace(/\s+/g, " ")
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max + 1)
  const space = cut.lastIndexOf(" ")
  const base = space > 0 ? cut.slice(0, space) : clean.slice(0, max)
  return `${base.replace(/[.,;:!?]+$/, "")}…`
}
