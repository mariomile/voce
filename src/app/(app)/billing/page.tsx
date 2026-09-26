import { BillingButton } from "@/components/billing-button"
import { CheckoutConfirmed, CheckoutPending } from "@/components/checkout-pending"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Card, CardActions, CardText, CardTitle } from "@/components/ui/card"
import { getBilling, getCurrentWorkspace, type Billing } from "@/lib/data"
import { formatDate, isoDateOf } from "@/lib/format"
import { PLAN_LIMITS } from "@/lib/plans"
import { stripeConfig } from "@/lib/stripe"

export const metadata = { title: "Piano" }

// The plan shown here is always the one the Stripe webhook wrote. Back from Checkout
// (?checkout=done) the page waits for it and says so: the URL never makes a workspace Pro.
export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  const workspace = await getCurrentWorkspace()
  const billing = await getBilling(workspace.id)
  const configured = stripeConfig() !== null
  const { checkout } = await searchParams
  const backFromCheckout = checkout === "done" && configured
  const pro = billing.plan === "pro"

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Piano</PageTitle>
          <PageLede>
            {pro ? (
              <>
                {workspace.name} è sul piano <b>Pro</b>: feedback illimitati e{" "}
                {PLAN_LIMITS.pro.analysesPerMonth} analisi al mese.
              </>
            ) : (
              <>
                {workspace.name} è sul piano <b>Free</b>: fino a {PLAN_LIMITS.free.feedback} feedback e{" "}
                {PLAN_LIMITS.free.analysesPerMonth} analisi al mese.
              </>
            )}
          </PageLede>
        </div>
      </PageHeader>

      {!configured && (
        <Card variant="soft" className="mb-8" role="status">
          <CardTitle>I pagamenti non sono attivi</CardTitle>
          <CardText className="mb-0">
            Mancano le chiavi di Stripe, quindi il piano non può cambiare
            {pro ? "." : " e il workspace resta Free."}
          </CardText>
        </Card>
      )}
      {backFromCheckout && !pro && <CheckoutPending />}
      {backFromCheckout && pro && <CheckoutConfirmed />}

      <div className="grid max-w-[760px] grid-cols-2 gap-5">
        <Card>
          <PlanHeading name="Free" price="0 €" period="per sempre" current={!pro} />
          <CardText>
            Fino a {PLAN_LIMITS.free.feedback} feedback, {PLAN_LIMITS.free.analysesPerMonth} analisi AI al
            mese, {PLAN_LIMITS.free.questionsPerMonth} domande ai feedback al mese.
          </CardText>
          {!pro && billing.stripeCustomerId && configured && billing.isOwner && (
            <CardActions>
              <BillingButton action="portal" label="Fatture e pagamenti" variant="secondary" />
            </CardActions>
          )}
        </Card>
        <Card variant={pro ? "default" : "highlight"}>
          <PlanHeading name="Pro" price="19 €" period="al mese" current={pro} />
          <CardText>
            Feedback illimitati, {PLAN_LIMITS.pro.analysesPerMonth} analisi AI al mese,{" "}
            {PLAN_LIMITS.pro.questionsPerMonth} domande ai feedback al mese.
            {pro && <> {proStatus(billing)}</>}
          </CardText>
          <CardActions>
            <ProAction billing={billing} configured={configured} waiting={backFromCheckout && !pro} />
          </CardActions>
        </Card>
      </div>
    </Page>
  )
}

function PlanHeading({ name, price, period, current }: { name: string; price: string; period: string; current: boolean }) {
  return (
    <>
      <CardTitle className="flex items-center gap-2">
        {name}
        {current && <Badge>Il tuo piano</Badge>}
      </CardTitle>
      <p className="mb-4 flex items-baseline gap-2">
        <span className="text-4xl leading-none font-bold tracking-numbers">{price}</span>
        <span className="text-md text-ink-muted group-data-[variant=highlight]/card:text-on-highlight">
          {period}
        </span>
      </p>
    </>
  )
}

function ProAction({ billing, configured, waiting }: { billing: Billing; configured: boolean; waiting: boolean }) {
  if (!configured || waiting) return null
  if (!billing.isOwner) {
    return <p className="text-sm">Solo l&apos;owner del workspace gestisce l&apos;abbonamento.</p>
  }
  if (billing.plan === "free") return <BillingButton action="checkout" label="Passa a Pro" />
  // Pro without a Stripe customer only happens with the development seed.
  if (!billing.stripeCustomerId) return null
  return <BillingButton action="portal" label="Gestisci o disdici" variant="secondary" />
}

function proStatus(billing: Billing) {
  if (billing.cancelAt) {
    return `Disdetto: resta Pro fino al ${day(billing.cancelAt)}, poi torna Free. I dati restano tutti.`
  }
  if (billing.stripeStatus === "past_due") {
    return "L'ultimo pagamento non è riuscito e Stripe sta riprovando: aggiorna il metodo di pagamento per restare Pro."
  }
  if (billing.currentPeriodEnd) return `Si rinnova il ${day(billing.currentPeriodEnd)}.`
  return ""
}

// "2026-10-25T08:00:00Z" → "25 ottobre", on the Italian calendar.
function day(timestamp: string) {
  return formatDate(isoDateOf(new Date(timestamp)))
}
