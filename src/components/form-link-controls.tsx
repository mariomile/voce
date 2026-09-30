"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { regenerateFormLink, setFormEnabled } from "@/app/(app)/research/[id]/collect/actions"
import { Button } from "@/components/ui/button"

// Turning the link off is reversible. A new link is not: the old link and printed QR codes stop working.
export function FormLinkControls({ researchId, enabled }: { researchId: string; enabled: boolean }) {
  const t = useTranslations("collect.formLink")
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean }>) {
    setFailed(false)
    startTransition(async () => {
      const result = await action()
      setFailed(!result.ok)
      setConfirming(false)
    })
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-ink-muted">
      {confirming ? (
        <>
          <span className="mr-2">{t("regenerateWarning")}</span>
          <Button disabled={pending} onClick={() => run(() => regenerateFormLink(researchId))}>
            {pending ? t("generating") : t("generate")}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
            {t("cancel")}
          </Button>
        </>
      ) : (
        <>
          {/* Actions on the link itself, quieter than sharing it: text buttons, not pills. */}
          <Button variant="text" disabled={pending} onClick={() => run(() => setFormEnabled(researchId, !enabled))}>
            {enabled ? t("disable") : t("enable")}
          </Button>
          <Button variant="text" disabled={pending} onClick={() => setConfirming(true)}>
            {t("regenerate")}
          </Button>
        </>
      )}
      {failed && <span className="text-problem">{t("failed")}</span>}
    </div>
  )
}
