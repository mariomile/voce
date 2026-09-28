"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { analyze, type AnalyzeResult } from "@/app/(app)/themes/actions"
import { Button } from "@/components/ui/button"

export type AnalysisFailure = Extract<AnalyzeResult, { ok: false }>["reason"]

// Shown here and by the room screen, which runs the same analysis: both read
// themes.analyzeButton.failures, so the wording stays the same in both places.
export type FailuresT = ReturnType<typeof useTranslations<"themes.analyzeButton.failures">>
export function failureMessage(t: FailuresT, failure: AnalysisFailure) {
  return t(failure)
}

// The analysis takes up to a few minutes: the button says so while it runs.
// When the monthly quota is used up, the button is off and the reason sits next to it.
export function AnalyzeButton({
  label,
  limitNote,
}: {
  label: string
  limitNote?: string
}) {
  const t = useTranslations("themes.analyzeButton")
  const tFailures = useTranslations("themes.analyzeButton.failures")
  const [failure, setFailure] = useState<AnalysisFailure | null>(null)
  const [pending, startTransition] = useTransition()

  function run() {
    setFailure(null)
    startTransition(async () => {
      const result = await analyze()
      if (!result.ok) setFailure(result.reason)
    })
  }

  const note = pending
    ? t("runningNote")
    : failure
      ? failureMessage(tFailures, failure)
      : limitNote
  return (
    <div className="flex max-w-[36ch] flex-col items-end gap-2 text-right">
      <Button onClick={run} disabled={pending || Boolean(limitNote)}>
        {pending ? t("running") : label}
      </Button>
      <p role="status" className="text-sm text-ink-muted empty:hidden">
        {failure && !pending ? <span className="text-problem">{note}</span> : note}
      </p>
    </div>
  )
}
