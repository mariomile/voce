"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useState, useTransition } from "react"
import { synthesize, type SynthesizeResult } from "@/app/(app)/research/[id]/actions"
import { Button, buttonVariants } from "@/components/ui/button"

export type AnalysisFailure = Extract<SynthesizeResult, { ok: false }>["reason"]

// Shown here and by the room screen, which runs the same analysis: both read
// themes.analyzeButton.failures, so the wording stays the same in both places.
export type FailuresT = ReturnType<typeof useTranslations<"themes.analyzeButton.failures">>
export function failureMessage(t: FailuresT, failure: AnalysisFailure) {
  return t(failure)
}

// After 2 minutes the wait gets its own note: the analysis goes on even if the PM leaves.
const SLOW_MS = 120_000

// "Analizza {n} feedback" of a Research. count: the feedback the server will send (the most recent, up
// to 500 and 1,000,000 characters); total: the feedback of the Research. notes: the cost and the other
// lines under the button. With the month's analyses used up the button is off (aria-disabled, so the
// focus stays on it) and limitNote says why. The result is announced in the status region.
export function AnalyzeButton({
  researchId,
  count,
  total,
  notes,
  limitNote,
}: {
  researchId: string
  count: number
  total: number
  notes: string[]
  limitNote?: string
}) {
  const t = useTranslations("research.synthesis.analyze")
  const tFailures = useTranslations("themes.analyzeButton.failures")
  const [outcome, setOutcome] = useState<
    { ok: true; themeCount: number } | { ok: false; reason: AnalysisFailure | "network" } | null
  >(null)
  const [slow, setSlow] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => clearTimeout(timer)
  }, [pending])

  function run() {
    if (pending || limitNote) return
    setOutcome(null)
    setSlow(false)
    startTransition(async () => {
      const result = await synthesize(researchId).catch(() => ({ ok: false as const, reason: "network" as const }))
      setOutcome(result)
    })
  }

  const partial = count < total
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
  else if (outcome?.ok) status = t("announcement", { count: outcome.themeCount })

  return (
    <div className="flex max-w-[36ch] flex-col items-end gap-2 text-right">
      <Button onClick={run} aria-disabled={pending || Boolean(limitNote) || undefined}>
        {pending ? t("running") : partial ? t("labelPartial", { count }) : t("label", { count })}
      </Button>
      {!pending && (
        <p className="text-sm text-ink-muted empty:hidden">
          {limitNote ?? [partial ? t("partialNote", { total }) : null, ...notes].filter(Boolean).join(" · ")}
        </p>
      )}
      <p role="status" className="text-sm text-ink-muted empty:hidden">
        {status}
      </p>
    </div>
  )
}
