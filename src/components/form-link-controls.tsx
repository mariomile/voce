"use client"

import { useState, useTransition } from "react"
import { regenerateFormLink, setFormEnabled } from "@/app/(app)/collect/actions"
import { Button } from "@/components/ui/button"

// Turning the link off is reversible. A new link is not: the old link and printed QR codes stop working.
export function FormLinkControls({ enabled }: { enabled: boolean }) {
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
    <div className="mt-4 flex flex-wrap items-center gap-3 text-base text-ink-muted">
      {confirming ? (
        <>
          <span className="mr-2">
            Il link attuale e il suo QR code smettono subito di funzionare. Il nuovo link è attivo.
          </span>
          <Button disabled={pending} onClick={() => run(regenerateFormLink)}>
            {pending ? "Genero…" : "Genera il nuovo link"}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
            Annulla
          </Button>
        </>
      ) : (
        <>
          <Button variant="secondary" disabled={pending} onClick={() => run(() => setFormEnabled(!enabled))}>
            {enabled ? "Spegni il link" : "Riaccendi il link"}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(true)}>
            Genera un nuovo link
          </Button>
        </>
      )}
      {failed && <span className="text-problem">Non è andata. Riprova tra poco.</span>}
    </div>
  )
}
