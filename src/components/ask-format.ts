import type { AskQuote, AskResult } from "@/app/(app)/research/[id]/ask/actions"
import { countLabel, type AskT } from "@/components/ask-copy"
import type { Locale } from "@/i18n/locale"
import { formatDate } from "@/lib/format"

// How an answer of Chiedi is laid out and copied. Pure functions: no model call, no state.

export type AskAnswered = Omit<Extract<AskResult, { outcome: "answered" }>, "ok" | "usage">
export type AskNoEvidence = Omit<Extract<AskResult, { outcome: "no_evidence" }>, "ok" | "usage">
export type AskOutcome = AskAnswered | AskNoEvidence

// The first sentence leads the answer, the rest reads smaller under it. A sentence ends at . ! or ?
// followed by a space and a capital letter (or an opening quote), so "1.5" and "per es. nei" stay whole.
export function splitAnswer(answer: string) {
  const text = answer.trim()
  const end = text.search(/[.!?](?=\s+["“«(]?\p{Lu})/u)
  if (end < 0) return { lead: text, rest: "" }
  return { lead: text.slice(0, end + 1), rest: text.slice(end + 1).trim() }
}

// Up to this length a feedback is shown whole; a longer one shows its key phrase, with the ellipses.
const WHOLE_UP_TO = 200

export type QuoteParts = { before: string; highlight: string; after: string; shortened: boolean }

export function compactQuote(text: string, highlight: string): QuoteParts {
  const at = highlight ? text.indexOf(highlight) : -1
  if (at < 0) return { before: text, highlight: "", after: "", shortened: false }
  const end = at + highlight.length
  if (text.length <= WHOLE_UP_TO) return { before: text.slice(0, at), highlight, after: text.slice(end), shortened: false }
  return { before: at > 0 ? "…" : "", highlight, after: end < text.length ? "…" : "", shortened: at > 0 || end < text.length }
}

export function fullQuote(text: string, highlight: string): QuoteParts {
  const at = highlight ? text.indexOf(highlight) : -1
  if (at < 0) return { before: text, highlight: "", after: "", shortened: false }
  return { before: text.slice(0, at), highlight, after: text.slice(at + highlight.length), shortened: false }
}

// The steps shown while Voce works: read the feedback, look for the ones that answer, check the quotes.
// The server does not stream: the steps follow the usual timing, and the last one waits for the answer.
export const PROGRESS_STEPS = 3
export function progressStep(elapsedMs: number) {
  if (elapsedMs < 1_500) return 0
  if (elapsedMs < 6_000) return 1
  return 2
}

export const quoteSource = (quote: Pick<AskQuote, "channel" | "receivedAt">, locale: Locale) =>
  `${quote.channel}, ${formatDate(quote.receivedAt, locale)}`

// What "Copia" puts on the clipboard: plain text that also reads as markdown. Each quote is the key phrase
// the model cited, verified word for word, with ellipses when it is part of a longer feedback.
export function answerAsText(t: AskT, result: AskOutcome, locale: Locale) {
  const lines = [t("clipboard.question", { question: result.question }), ""]
  if (result.outcome === "no_evidence") {
    lines.push(t("clipboard.noEvidence", { count: result.feedbackConsidered }))
    return lines.join("\n")
  }
  lines.push(
    t("clipboard.count", {
      count: result.feedbackCount,
      countLabel: countLabel(t, result.feedbackCount),
      considered: result.feedbackConsidered,
    }),
    "",
    result.answer.trim()
  )
  if (result.quotes.length > 0) {
    lines.push("", t("clipboard.quotes"))
    for (const quote of result.quotes) {
      const at = quote.text.indexOf(quote.highlight)
      const phrase =
        at < 0
          ? quote.text
          : `${at > 0 ? "…" : ""}${quote.highlight}${at + quote.highlight.length < quote.text.length ? "…" : ""}`
      lines.push(`- “${phrase}” (${quoteSource(quote, locale)})`)
    }
  }
  return lines.join("\n")
}
