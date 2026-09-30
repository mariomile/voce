"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { unstable_rethrow } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { deleteResearch } from "@/app/(app)/research/actions"
import { announceResearchDeleted, cancelResearchDeleted } from "@/components/research-deleted"
import { Button, buttonVariants } from "@/components/ui/button"

// "Elimina la Research" at the bottom of the Raccolta, with the confirmation in the row (D1), like a new
// form link: the focus goes to Annulla, Esc and Annulla close and give it back. On success the server sends
// the browser to /research; otherwise D2 or the session note.
export function DeleteResearch({
  researchId,
  question,
  feedbackCount,
}: {
  researchId: string
  question: string
  feedbackCount: number
}) {
  const t = useTranslations("research.delete")
  const [confirming, setConfirming] = useState(false)
  const [failure, setFailure] = useState<"failed" | "session" | null>(null)
  const [pending, startTransition] = useTransition()
  const open = useRef<HTMLButtonElement>(null)
  const focusOpen = useRef(false)

  useEffect(() => {
    if (confirming || !focusOpen.current) return
    focusOpen.current = false
    open.current?.focus()
  }, [confirming])

  function cancel() {
    if (pending) return
    focusOpen.current = true
    setFailure(null)
    setConfirming(false)
  }

  function confirm() {
    if (pending) return
    setFailure(null)
    announceResearchDeleted()
    startTransition(async () => {
      let reason: "failed" | "session"
      try {
        // Only a failure comes back: a deletion ends on /research, and the redirect arrives as an error.
        reason = (await deleteResearch(researchId)).reason
      } catch (error) {
        unstable_rethrow(error)
        reason = "failed"
      }
      cancelResearchDeleted()
      setFailure(reason)
    })
  }

  return (
    <section className="mt-12 border-t border-line pt-6">
      {confirming ? (
        <div
          onKeyDown={(event) => {
            if (event.key === "Escape") cancel()
          }}
        >
          <p className="mb-3 max-w-[64ch] text-base">{t("confirm", { question, count: feedbackCount })}</p>
          <div className="flex items-center gap-6">
            <Button variant="text" autoFocus onClick={cancel}>
              {t("cancel")}
            </Button>
            <Button variant="secondary" aria-disabled={pending || undefined} onClick={confirm}>
              {pending ? t("deleting") : t("submit")}
            </Button>
          </div>
        </div>
      ) : (
        <Button ref={open} variant="text" onClick={() => setConfirming(true)}>
          {t("open")}
        </Button>
      )}
      <p role="status" className="mt-2 text-sm empty:hidden">
        {failure === "failed" && <span className="text-problem">{t("failed")}</span>}
        {failure === "session" && (
          <span className="text-problem">
            {t("session")}{" "}
            <Link href="/login" className={buttonVariants({ variant: "link", className: "text-sm" })}>
              {t("sessionLink")}
            </Link>
          </span>
        )}
      </p>
    </section>
  )
}
