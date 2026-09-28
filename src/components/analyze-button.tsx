"use client"

import { useState, useTransition } from "react"
import { analyze, type AnalyzeResult } from "@/app/(app)/themes/actions"
import { Button } from "@/components/ui/button"

export type AnalysisFailure = Extract<AnalyzeResult, { ok: false }>["reason"]

// Also shown by the room screen, which runs the same analysis.
export const ANALYSIS_FAILURES: Record<AnalysisFailure, string> = {
  no_feedback: "Negli ultimi 90 giorni non ci sono feedback da analizzare.",
  busy: "C'è già un'analisi in corso. Ricarica la pagina tra un minuto.",
  limit: "Hai usato tutte le analisi di questo mese, o troppi tentativi non sono riusciti.",
  no_themes:
    "L'analisi non ha trovato temi con almeno 2 feedback e non conta nel limite del mese. Non è cambiato nulla.",
  failed: "L'analisi non è riuscita e non conta nel limite del mese. Non è cambiato nulla: riprova tra poco.",
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
    ? "Può volerci qualche minuto. I temi compaiono qui appena è finita."
    : failure
      ? ANALYSIS_FAILURES[failure]
      : limitNote
  return (
    <div className="flex max-w-[36ch] flex-col items-end gap-2 text-right">
      <Button onClick={run} disabled={pending || Boolean(limitNote)}>
        {pending ? "Analisi in corso…" : label}
      </Button>
      <p role="status" className="text-sm text-ink-muted empty:hidden">
        {failure && !pending ? <span className="text-problem">{note}</span> : note}
      </p>
    </div>
  )
}
