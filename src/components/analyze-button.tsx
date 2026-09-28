"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState, useTransition } from "react"
import { synthesize, type SynthesizeResult, type VerdictCounts } from "@/app/(app)/research/[id]/actions"
import { useVerdictFailure } from "@/components/synthesis-outcome"
import { Button, buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/i18n/locale"
import { formatDate } from "@/lib/format"

export type AnalysisFailure = Extract<SynthesizeResult, { ok: false }>["reason"]

// Shown here and by the room screen, which runs the same analysis: both read
// themes.analyzeButton.failures, so the wording stays the same in both places.
export type FailuresT = ReturnType<typeof useTranslations<"themes.analyzeButton.failures">>
export function failureMessage(t: FailuresT, failure: AnalysisFailure) {
  return t(failure)
}

type Done = Extract<SynthesizeResult, { ok: true }>
type AnalyzeT = ReturnType<typeof useTranslations<"research.synthesis.analyze">>

// A synthesis with at least one part done. Themes done: the announcement, with the verdicts when they came
// (a failed verdict is S6, shown in the Ipotesi section). Themes not done (so the verdict is): S5, with the day
// of the themes still shown.
export function resultMessage(t: AnalyzeT, result: Done, locale: Locale, months: Months) {
  if (result.themes !== "done") {
    const text = result.previousThemesDate
      ? t("themesFailed", { date: formatDate(result.previousThemesDate, locale) })
      : t("themesFailedFirst")
    return { text, problem: true }
  }
  const announcement = t("announcement", { count: result.themeCount })
  // The server ran the themes alone: only 1 analysis was left (S4), maybe after another tab used one.
  if (result.verdict === "limit") return { text: `${announcement} ${t("themesOnlyNote", months)}`, problem: false }
  if (result.verdict !== "done") return { text: announcement, problem: false }
  return { text: `${announcement} ${verdictsMessage(t, result.verdicts)}`, problem: false }
}

// "2 verdetti: 1 confermata, 1 da rivedere.": only the words that occur.
export function verdictsMessage(t: AnalyzeT, verdicts: VerdictCounts) {
  const parts = [
    verdicts.confirmed && t("confirmedCount", { count: verdicts.confirmed }),
    verdicts.refuted && t("refutedCount", { count: verdicts.refuted }),
    verdicts.toReview && t("toReviewCount", { count: verdicts.toReview }),
  ].filter(Boolean)
  const count = verdicts.confirmed + verdicts.refuted + verdicts.toReview
  return t("announcementVerdicts", { count, parts: parts.join(", ") })
}

// After 2 minutes the wait gets its own note: the analysis goes on even if the PM leaves.
const SLOW_MS = 120_000

type Months = { month: string; nextMonth: string }

// "Analizza {n} feedback" of a Research. count: the feedback the server will send (the most recent, up
// to 500 and 1,000,000 characters); total: the feedback of the Research. The cost comes before the click:
// 1 analysis for the themes, 1 more for the verdict when the Research has hypotheses; with only 1 left and
// hypotheses, the themes alone (S4), as the server will do. notes: the other lines under the button. With
// the month's analyses used up the button is off (aria-disabled, so the focus stays on it) and limitNote
// says why. The result is announced in the status region.
export function AnalyzeButton({
  researchId,
  count,
  total,
  quota,
  hypothesisCount,
  notes = [],
  limitNote,
}: {
  researchId: string
  count: number
  total: number
  quota: Months & { remaining: number; limit: number }
  hypothesisCount: number
  notes?: string[]
  limitNote?: string
}) {
  const t = useTranslations("research.synthesis.analyze")
  const tFailures = useTranslations("themes.analyzeButton.failures")
  const locale = useLocale()
  const [outcome, setOutcome] = useState<Done | { ok: false; reason: AnalysisFailure | "network" } | null>(null)
  const [slow, setSlow] = useState(false)
  const [pending, startTransition] = useTransition()
  const verdictFailure = useVerdictFailure()

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => clearTimeout(timer)
  }, [pending])

  function run() {
    if (pending || limitNote) return
    setOutcome(null)
    setSlow(false)
    verdictFailure.setFailed(false)
    startTransition(async () => {
      const result = await synthesize(researchId).catch(() => ({ ok: false as const, reason: "network" as const }))
      setOutcome(result)
      if (result.ok && result.verdict === "failed") verdictFailure.setFailed(true)
    })
  }

  const partial = count < total
  const themesOnly = hypothesisCount > 0 && quota.remaining === 1
  const months = { month: quota.month, nextMonth: quota.nextMonth }
  let cost: string
  if (themesOnly) cost = t("themesOnlyNote", months)
  else if (hypothesisCount > 0) cost = t("cost.two", { limit: quota.limit, month: quota.month })
  else if (quota.remaining === quota.limit) cost = t("cost.one", { limit: quota.limit, month: quota.month })
  else cost = t("cost.left", { remaining: quota.remaining, month: quota.month })
  let label = t("label", { count })
  if (themesOnly) label = t("labelThemesOnly", { count })
  else if (partial) label = t("labelPartial", { count })
  const failure = outcome && !outcome.ok ? outcome.reason : null
  let status: React.ReactNode
  if (pending) status = slow ? t("slowNote") : t("runningNote")
  else if (failure === "network") status = <span className="text-problem">{t("network")}</span>
  else if (failure === "session")
    status = (
      <span className="text-problem">
        {failureMessage(tFailures, failure)}{" "}
        <Link href="/login" className={buttonVariants({ variant: "link", className: "text-sm" })}>
          {t("sessionLink")}
        </Link>
      </span>
    )
  else if (failure) status = <span className="text-problem">{failureMessage(tFailures, failure)}</span>
  else if (outcome?.ok) {
    const message = resultMessage(t, outcome, locale, months)
    status = message.problem ? <span className="text-problem">{message.text}</span> : message.text
  }

  return (
    <div className="flex max-w-[36ch] flex-col items-end gap-2 text-right">
      <Button onClick={run} aria-disabled={pending || Boolean(limitNote) || undefined}>
        {pending ? t("running") : label}
      </Button>
      {!pending && (
        <p className="text-sm text-ink-muted empty:hidden">
          {limitNote ?? [partial ? t("partialNote", { total }) : null, cost, ...notes].filter(Boolean).join(" · ")}
        </p>
      )}
      <p role="status" className="text-sm text-ink-muted empty:hidden">
        {status}
      </p>
    </div>
  )
}
