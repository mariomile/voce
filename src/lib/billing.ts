import "server-only"

import type Stripe from "stripe"
import { saveBilling } from "./supabase/admin"
import type { Plan } from "./types"

// While Stripe retries a failed payment (past_due) the workspace keeps Pro.
const PRO_STATUSES: string[] = ["active", "trialing", "past_due"]

export type BillingState = {
  plan: Plan
  stripeSubscriptionId: string | null
  stripeStatus: string | null
  currentPeriodEnd: string | null
  // Set when the subscription is cancelled and will end on that date.
  cancelAt: string | null
}

// The subscription that decides the plan: one that gives Pro if there is any, otherwise the newest.
// Only a subscription to the Pro price gives Pro, whatever else the customer bought or switched to.
export function billingStateOf(subscriptions: Stripe.Subscription[], proPriceId: string): BillingState {
  const givesPro = (s: Stripe.Subscription) =>
    PRO_STATUSES.includes(s.status) && s.items.data.some((item) => item.price.id === proPriceId)
  const newestFirst = [...subscriptions].sort((a, b) => b.created - a.created)
  const current = newestFirst.find(givesPro) ?? newestFirst[0]
  if (!current) {
    return { plan: "free", stripeSubscriptionId: null, stripeStatus: null, currentPeriodEnd: null, cancelAt: null }
  }
  const plan = givesPro(current) ? "pro" : "free"
  const periodEnd = current.items.data[0]?.current_period_end ?? null
  const cancelAt = current.cancel_at ?? (current.cancel_at_period_end ? periodEnd : null)
  return {
    plan,
    stripeSubscriptionId: current.id,
    stripeStatus: current.status,
    currentPeriodEnd: toIso(periodEnd),
    cancelAt: plan === "pro" ? toIso(cancelAt) : null,
  }
}

export async function subscriptionsOf(stripe: Stripe, customerId: string) {
  const { data } = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 })
  return data
}

// Reads the customer's subscriptions from Stripe as they are now and writes that state.
// Never the content of an event: a repeated or late event writes the same, current state.
// The time the read started orders two webhooks running together: the later read wins.
export async function syncCustomer(stripe: Stripe, proPriceId: string, customerId: string) {
  const readAt = new Date()
  const state = billingStateOf(await subscriptionsOf(stripe, customerId), proPriceId)
  return saveBilling(customerId, state, readAt)
}

function toIso(seconds: number | null) {
  return seconds === null ? null : new Date(seconds * 1000).toISOString()
}
