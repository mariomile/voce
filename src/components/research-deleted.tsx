"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

// Set by "Elimina la Research" just before the deletion, read once by /research where the action sends the
// browser: the list says "Research eliminata." and, with Research left, its title takes the focus. Only after
// a deletion: a normal visit says nothing.
let deletedPending = false

export function announceResearchDeleted() {
  deletedPending = true
}

export function cancelResearchDeleted() {
  deletedPending = false
}

// The status region is on the page from the start, so the message is announced when it appears.
export function ResearchDeletedNotice({ focusId }: { focusId?: string }) {
  const t = useTranslations("research.list")
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!deletedPending) return
    deletedPending = false
    // Read once, after the page is on screen: the flag lives outside React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(true)
    if (focusId) document.getElementById(focusId)?.focus()
  }, [focusId])
  return (
    <p role="status" className="mb-6 text-md text-ink empty:hidden">
      {shown ? t("deleted") : null}
    </p>
  )
}
