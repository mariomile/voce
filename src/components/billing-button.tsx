"use client"

import { useState, useTransition } from "react"
import { openPortal, startCheckout, type BillingActionResult } from "@/app/(app)/billing/actions"
import { Button } from "@/components/ui/button"

type Failure = BillingActionResult["reason"]

const MESSAGES: Record<Failure, string> = {
  not_configured: "I pagamenti non sono attivi.",
  not_owner: "Solo l'owner del workspace gestisce l'abbonamento.",
  already_pro: "Il workspace è già Pro.",
  pending: "Hai già un abbonamento: stiamo aspettando la conferma di Stripe. Ricarica tra qualche secondo.",
  no_customer: "Questo workspace non ha ancora un abbonamento su Stripe.",
  failed: "Stripe non risponde. Riprova tra poco.",
}

// On success the action sends the browser to Stripe, so only failures come back here.
export function BillingButton({
  action,
  label,
  variant = "default",
}: {
  action: "checkout" | "portal"
  label: string
  variant?: "default" | "secondary"
}) {
  const [failure, setFailure] = useState<Failure | null>(null)
  const [pending, startTransition] = useTransition()

  function run() {
    setFailure(null)
    startTransition(async () => {
      const result = await (action === "checkout" ? startCheckout() : openPortal())
      if (result && !result.ok) setFailure(result.reason)
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant={variant} onClick={run} disabled={pending}>
        {pending ? "Apro Stripe…" : label}
      </Button>
      {failure && (
        <p role="status" className="text-sm text-problem">
          {MESSAGES[failure]}
        </p>
      )}
    </div>
  )
}
