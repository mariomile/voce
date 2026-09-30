"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"
import { deleteFeedback } from "@/app/(app)/research/[id]/feedback/actions"
import { Button } from "@/components/ui/button"

// Two clicks: "Elimina" asks, "Sì, elimina" deletes. The row goes away when the page refreshes.
// The focus stays in the table: Elimina → Annulla, Annulla or Esc → Elimina, and after the deletion the
// Elimina of the row that takes its place (or of the row above, for the last one).
export function DeleteFeedbackButton({ feedbackId }: { feedbackId: string }) {
  const t = useTranslations("feedback.delete")
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const root = useRef<HTMLDivElement>(null)
  const open = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const toggled = useRef(false)

  useEffect(() => {
    if (!toggled.current) return
    ;(confirming ? cancel : open).current?.focus()
  }, [confirming])

  function toggle(next: boolean) {
    toggled.current = true
    setConfirming(next)
  }

  function remove() {
    setFailed(false)
    const row = root.current?.closest("tr")
    const neighbour = (row?.nextElementSibling ?? row?.previousElementSibling)?.querySelector<HTMLButtonElement>(
      "[data-delete-feedback] button"
    )
    startTransition(async () => {
      const result = await deleteFeedback(feedbackId)
      if (!result.ok) setFailed(true)
      else neighbour?.focus()
    })
  }

  return (
    <div ref={root} data-delete-feedback className="contents">
      {!confirming ? (
        // At the table's right edge: the touch area stops there, or the table would scroll sideways by 8 px.
        <Button ref={open} variant="text" className="text-sm pointer-coarse:after:right-0" onClick={() => toggle(true)}>
          {t("button")}
        </Button>
      ) : (
        <div
          className="flex flex-col items-end gap-2"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !pending) toggle(false)
          }}
        >
          <span className="text-sm text-ink-muted">{t("confirmQuestion")}</span>
          <div className="flex items-center gap-4">
            <Button ref={cancel} variant="text" className="text-sm" onClick={() => toggle(false)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button variant="text" className="text-sm text-problem pointer-coarse:after:right-0" onClick={remove} disabled={pending}>
              {pending ? t("pending") : t("confirm")}
            </Button>
          </div>
          {failed && (
            <span role="alert" className="text-sm text-problem">
              {t("failed")}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
