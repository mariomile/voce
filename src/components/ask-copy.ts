import type { useTranslations } from "next-intl"
import type { Locale } from "@/i18n/locale"
import { formatMonth, monthOf } from "@/lib/format"
import { PLAN_LIMITS } from "@/lib/plans"
import type { Plan } from "@/lib/types"

// The texts of "Chiedi" that depend on numbers or on the reason a question did not get an answer.
// Exact strings from the design of the initiative (DESIGN.md, "Error copy"), read from the "ask"
// catalog: it carries the Italian source and the English translation.
export type AskT = ReturnType<typeof useTranslations<"ask">>

export function askErrors(t: AskT) {
  return {
    empty: t("errors.empty"),
    tooLong: t("errors.tooLong"),
    busy: t("errors.busy"),
    network: t("errors.network"),
    session: { text: t("errors.sessionText"), link: t("errors.sessionLink"), href: "/login" },
    noFeedback: { text: t("errors.noFeedbackText"), link: t("errors.noFeedbackLink"), href: "/collect" },
  }
}

export function failedMessage(t: AskT, usage: { used: number; quota: number }, month: string) {
  const left = Math.max(0, usage.quota - usage.used)
  if (left === 0) return t("failed.zero", { month })
  return t("failed.rest", { left, month })
}

// Under the button: what the next question costs, with the numbers read by the server.
export function quotaNote(t: AskT, usage: { used: number; quota: number }, month: string) {
  if (usage.used === 0) return t("quotaNote.first", { quota: usage.quota, month })
  const left = Math.max(0, usage.quota - usage.used)
  return t("quotaNote.left", { left, month })
}

export function limitNotice(t: AskT, plan: Plan, quota: number, month: string, nextMonth: string) {
  const title = t("limitNotice.title", { quota, month })
  return plan === "free"
    ? { title, text: t("limitNotice.free", { proLimit: PLAN_LIMITS.pro.questionsPerMonth, nextMonth }), upgrade: true }
    : { title, text: t("limitNotice.pro", { nextMonth }), upgrade: false }
}

// The month after the current one on the Italian calendar, when the quota comes back.
export function nextMonthName(now: Date, locale: Locale) {
  const [year, month] = monthOf(now).split("-").map(Number)
  return formatMonth(new Date(Date.UTC(year, month, 15)), locale)
}

export function slowMessage(t: AskT) {
  return t("slow")
}

// The button says how many feedback the question reads: the 500 most recent at most.
export function askButtonLabel(t: AskT, feedbackConsidered: number, feedbackInWindow: number) {
  if (feedbackInWindow > feedbackConsidered) return t("button.partial", { count: feedbackConsidered })
  return feedbackConsidered === 1 ? t("button.one") : t("button.some", { count: feedbackConsidered })
}

export const countLabel = (t: AskT, count: number) => t("count", { count })

// Read by screen readers from the status region when the answer arrives. The quotes are not read:
// they are under the answer heading.
export function answerSummary(
  t: AskT,
  result:
    | { outcome: "answered"; feedbackCount: number; answer: string; quoteCount: number; feedbackConsidered: number }
    | { outcome: "no_evidence"; feedbackConsidered: number }
) {
  if (result.outcome === "no_evidence") return t("summary.noEvidence", { count: result.feedbackConsidered })
  const quotes = result.quoteCount === 1 ? t("summary.quotesOne") : t("summary.quotesOther", { count: result.quoteCount })
  return t("summary.answered", {
    count: result.feedbackCount,
    countLabel: countLabel(t, result.feedbackCount),
    answer: result.answer,
    quotes,
  })
}
