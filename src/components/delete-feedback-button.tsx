"use client"

import { useState, useTransition } from "react"
import { deleteFeedback } from "@/app/(app)/feedback/actions"
import { Button } from "@/components/ui/button"

// Two clicks: "Elimina" asks, "Sì, elimina" deletes. The row goes away when the page refreshes.
export function DeleteFeedbackButton({ feedbackId }: { feedbackId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function remove() {
    setFailed(false)
    startTransition(async () => {
      const result = await deleteFeedback(feedbackId)
      if (!result.ok) setFailed(true)
    })
  }

  if (!confirming)
    return (
      <Button variant="link" className="text-sm text-ink-muted" onClick={() => setConfirming(true)}>
        Elimina
      </Button>
    )

  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-sm text-ink-muted">Eliminare questo feedback?</span>
      <div className="flex items-center gap-4">
        <Button variant="link" className="text-sm" onClick={() => setConfirming(false)} disabled={pending}>
          Annulla
        </Button>
        <Button variant="link" className="text-sm text-problem" onClick={remove} disabled={pending}>
          {pending ? "Elimino…" : "Sì, elimina"}
        </Button>
      </div>
      {failed && (
        <span role="alert" className="text-sm text-problem">
          Non è stato eliminato. Riprova.
        </span>
      )}
    </div>
  )
}
