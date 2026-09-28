"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { openPortal, startCheckout, type BillingActionResult } from "@/app/(app)/billing/actions"
import { Button } from "@/components/ui/button"

type Failure = BillingActionResult["reason"]

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
  const t = useTranslations("billing.button")
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
        {pending ? t("openingStripe") : label}
      </Button>
      {failure && (
        <p role="status" className="text-sm text-problem">
          {t(`errors.${failure}`)}
        </p>
      )}
    </div>
  )
}
