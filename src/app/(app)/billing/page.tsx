import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { BillingButton } from "@/components/billing-button"
import { CheckoutConfirmed, CheckoutPending } from "@/components/checkout-pending"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { Badge } from "@/components/ui/badge"
import { Card, CardActions, CardText, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/i18n/locale"
import { getBilling, getCurrentWorkspace, type Billing } from "@/lib/data"
import { formatDate, isoDateOf } from "@/lib/format"
import { PLAN_LIMITS } from "@/lib/plans"
import { stripeConfig } from "@/lib/stripe"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.metadata")
  return { title: t("title") }
}

// The plan shown here is always the one the Stripe webhook wrote. Back from Checkout
// (?checkout=done) the page waits for it and says so: the URL never makes a workspace Pro.
export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  const t = await getTranslations("billing.page")
  const locale = await getLocale()
  const workspace = await getCurrentWorkspace()
  const billing = await getBilling(workspace.id)
  const configured = stripeConfig() !== null
  const { checkout } = await searchParams
  const backFromCheckout = checkout === "done" && configured
  const pro = billing.plan === "pro"
  const b = (chunks: React.ReactNode) => <b>{chunks}</b>

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>{t("title")}</PageTitle>
          <PageLede>
            {pro
              ? t.rich("ledePro", { name: workspace.name, analyses: PLAN_LIMITS.pro.analysesPerMonth, b })
              : t.rich("ledeFree", {
                  name: workspace.name,
                  feedback: PLAN_LIMITS.free.feedback ?? 0,
                  analyses: PLAN_LIMITS.free.analysesPerMonth,
                  b,
                })}
          </PageLede>
        </div>
      </PageHeader>

      {!configured && (
        <Card variant="soft" className="mb-8" role="status">
          <CardTitle>{t("notConfiguredTitle")}</CardTitle>
          <CardText className="mb-0">{pro ? t("notConfiguredTextPro") : t("notConfiguredTextFree")}</CardText>
        </Card>
      )}
      {backFromCheckout && !pro && <CheckoutPending />}
      {backFromCheckout && pro && <CheckoutConfirmed />}

      <div className="grid max-w-[760px] grid-cols-1 gap-5 sm:grid-cols-2">
        <Card>
          <PlanHeading name={t("freeName")} price={t("freePrice")} period={t("freePeriod")} current={!pro} yourPlan={t("yourPlan")} />
          <CardText>
            {t("freeDescription", {
              feedback: PLAN_LIMITS.free.feedback ?? 0,
              analyses: PLAN_LIMITS.free.analysesPerMonth,
              questions: PLAN_LIMITS.free.questionsPerMonth,
            })}
          </CardText>
          {!pro && billing.stripeCustomerId && configured && billing.isOwner && (
            <CardActions>
              <BillingButton action="portal" label={t("invoices")} variant="secondary" />
            </CardActions>
          )}
        </Card>
        <Card variant={pro ? "default" : "highlight"}>
          <PlanHeading name={t("proName")} price={t("proPrice")} period={t("proPeriod")} current={pro} yourPlan={t("yourPlan")} />
          <CardText>
            {t("proDescription", {
              analyses: PLAN_LIMITS.pro.analysesPerMonth,
              questions: PLAN_LIMITS.pro.questionsPerMonth,
            })}
            {pro && <> {proStatus(t, billing, locale)}</>}
          </CardText>
          <CardActions>
            <ProAction billing={billing} configured={configured} waiting={backFromCheckout && !pro} t={t} />
          </CardActions>
        </Card>
      </div>
    </Page>
  )
}

function PlanHeading({
  name,
  price,
  period,
  current,
  yourPlan,
}: {
  name: string
  price: string
  period: string
  current: boolean
  yourPlan: string
}) {
  return (
    <>
      <CardTitle className="flex items-center gap-2">
        {name}
        {current && <Badge>{yourPlan}</Badge>}
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

function ProAction({
  billing,
  configured,
  waiting,
  t,
}: {
  billing: Billing
  configured: boolean
  waiting: boolean
  t: Awaited<ReturnType<typeof getTranslations<"billing.page">>>
}) {
  if (!configured || waiting) return null
  if (!billing.isOwner) {
    return <p className="text-sm">{t("ownerOnly")}</p>
  }
  if (billing.plan === "free") return <BillingButton action="checkout" label={t("upgrade")} />
  // Pro without a Stripe customer only happens with the development seed.
  if (!billing.stripeCustomerId) return null
  return <BillingButton action="portal" label={t("manage")} variant="secondary" />
}

function proStatus(t: Awaited<ReturnType<typeof getTranslations<"billing.page">>>, billing: Billing, locale: Locale) {
  if (billing.cancelAt) return t("cancelStatus", { date: day(billing.cancelAt, locale) })
  if (billing.stripeStatus === "past_due") return t("pastDueStatus")
  if (billing.currentPeriodEnd) return t("renewsStatus", { date: day(billing.currentPeriodEnd, locale) })
  return ""
}

// "2026-10-25T08:00:00Z" → "25 ottobre", "October 25", on the Italian calendar.
function day(timestamp: string, locale: Locale) {
  return formatDate(isoDateOf(new Date(timestamp)), locale)
}
