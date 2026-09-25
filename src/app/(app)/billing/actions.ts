"use server"

import { redirect } from "next/navigation"
import { billingStateOf, subscriptionsOf } from "@/lib/billing"
import { getBilling, getCurrentWorkspace } from "@/lib/data"
import { getOrigin } from "@/lib/origin"
import { stripeConfig } from "@/lib/stripe"
import { saveStripeCustomer } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Both actions only send the owner to a Stripe page. The plan changes later, when the webhook arrives.
// Neither takes input: the workspace comes from the session.

export type BillingActionResult = {
  ok: false
  reason: "not_configured" | "not_owner" | "already_pro" | "pending" | "no_customer" | "failed"
}

// Mentioned in the Stripe Dashboard to tell this flow apart. The suffix is random, fixed once.
const INTEGRATION_IDENTIFIER = "voce-pro-checkout-qhzmtrbw"

export async function startCheckout(): Promise<BillingActionResult> {
  const config = stripeConfig()
  if (!config) return { ok: false, reason: "not_configured" }
  const workspace = await getCurrentWorkspace()
  const billing = await getBilling(workspace.id)
  if (!billing.isOwner) return { ok: false, reason: "not_owner" }
  if (billing.plan === "pro") return { ok: false, reason: "already_pro" }

  let url: string
  try {
    let customerId = billing.stripeCustomerId
    if (customerId) {
      // Paid a moment ago and the webhook is not here yet: a second Checkout would charge twice.
      if (billingStateOf(await subscriptionsOf(config.client, customerId), config.priceId).plan === "pro") {
        return { ok: false, reason: "pending" }
      }
      // A Checkout left open in another tab could still be paid: close it, so only this one can.
      const open = await config.client.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 })
      for (const session of open.data) await config.client.checkout.sessions.expire(session.id)
    } else {
      const supabase = await createClient()
      const { data } = await supabase.auth.getClaims()
      const customer = await config.client.customers.create({
        email: typeof data?.claims.email === "string" ? data.claims.email : undefined,
        name: workspace.name,
        // For people reading the Dashboard. The webhook finds the workspace by customer id.
        metadata: { workspace_id: workspace.id },
      })
      customerId = await saveStripeCustomer(workspace.id, customer.id)
    }
    const origin = await getOrigin()
    const session = await config.client.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: workspace.id,
      line_items: [{ price: config.priceId, quantity: 1 }],
      locale: "it",
      success_url: `${origin}/billing?checkout=done`,
      cancel_url: `${origin}/billing`,
      integration_identifier: INTEGRATION_IDENTIFIER,
    })
    url = session.url!
  } catch (error) {
    console.error("Stripe Checkout failed:", errorMessage(error))
    return { ok: false, reason: "failed" }
  }
  redirect(url)
}

export async function openPortal(): Promise<BillingActionResult> {
  const config = stripeConfig()
  if (!config) return { ok: false, reason: "not_configured" }
  const workspace = await getCurrentWorkspace()
  const billing = await getBilling(workspace.id)
  if (!billing.isOwner) return { ok: false, reason: "not_owner" }
  if (!billing.stripeCustomerId) return { ok: false, reason: "no_customer" }

  let url: string
  try {
    const session = await config.client.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${await getOrigin()}/billing`,
      locale: "it",
    })
    url = session.url
  } catch (error) {
    console.error("Stripe customer portal failed:", errorMessage(error))
    return { ok: false, reason: "failed" }
  }
  redirect(url)
}

// Stripe messages name the problem (a portal not set up, an unknown price) and hold no keys.
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error"
}
