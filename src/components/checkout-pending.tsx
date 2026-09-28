"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardText, CardTitle } from "@/components/ui/card"

const LATE_AFTER_MS = 60_000
const GIVE_UP_AFTER_MS = 10 * 60_000

// Back from Checkout, the plan is still Free until the webhook writes it. The page asks the server
// again every 2 seconds (every 10 once it is late, never after 10 minutes) and this card goes away
// when the plan is Pro.
export function CheckoutPending() {
  const t = useTranslations("billing.checkoutPending")
  const router = useRouter()
  const [stage, setStage] = useState<"waiting" | "late" | "stopped">("waiting")

  useEffect(() => {
    const started = Date.now()
    let timer: ReturnType<typeof setTimeout>
    function check() {
      const elapsed = Date.now() - started
      if (elapsed > GIVE_UP_AFTER_MS) return setStage("stopped")
      setStage(elapsed > LATE_AFTER_MS ? "late" : "waiting")
      router.refresh()
      timer = setTimeout(check, elapsed > LATE_AFTER_MS ? 10_000 : 2_000)
    }
    timer = setTimeout(check, 2_000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <Card variant="soft" className="mb-8" role="status">
      <CardTitle>{stage === "waiting" ? t("waitingTitle") : t("lateTitle")}</CardTitle>
      <CardText className="mb-0">
        {stage === "waiting" ? t("waitingText") : stage === "late" ? t("lateText") : t("stoppedText")}
      </CardText>
    </Card>
  )
}

// Once confirmed, drops ?checkout=done from the address: a reload shows the plan, not the confirmation.
export function CheckoutConfirmed() {
  const t = useTranslations("billing.checkoutPending")
  useEffect(() => {
    window.history.replaceState(null, "", "/billing")
  }, [])
  return (
    <Card variant="soft" className="mb-8" role="status">
      <CardTitle>{t("confirmedTitle")}</CardTitle>
      <CardText className="mb-0">{t("confirmedText")}</CardText>
    </Card>
  )
}
