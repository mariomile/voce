"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { deleteFeedback } from "@/app/(app)/research/[id]/feedback/actions"
import { Button } from "@/components/ui/button"

// Two clicks: "Elimina" asks, "Sì, elimina" deletes. The row goes away when the page refreshes.
export function DeleteFeedbackButton({ feedbackId }: { feedbackId: string }) {
  const t = useTranslations("feedback.delete")
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
        {t("button")}
      </Button>
    )

  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-sm text-ink-muted">{t("confirmQuestion")}</span>
      <div className="flex items-center gap-4">
        <Button variant="link" className="text-sm" onClick={() => setConfirming(false)} disabled={pending}>
          {t("cancel")}
        </Button>
        <Button variant="link" className="text-sm text-problem" onClick={remove} disabled={pending}>
          {pending ? t("pending") : t("confirm")}
        </Button>
      </div>
      {failed && (
        <span role="alert" className="text-sm text-problem">
          {t("failed")}
        </span>
      )}
    </div>
  )
}
