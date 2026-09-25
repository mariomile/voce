import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import type { Usage } from "@/lib/data"

export function LimitWarning({ usage }: { usage: Usage }) {
  return (
    <Card variant="soft" layout="row" className="mb-8">
      <div>
        <CardTitle>Hai raggiunto {usage.feedbackLimit} feedback, il limite del piano Free</CardTitle>
        <CardText>
          Il modulo pubblico non accetta nuovi feedback. Con Pro i feedback sono illimitati e le
          analisi diventano 100 al mese.
        </CardText>
      </div>
      <Link href="/billing" className={buttonVariants()}>
        Passa a Pro
      </Link>
    </Card>
  )
}
