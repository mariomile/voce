import type Stripe from "stripe"
import { syncCustomer } from "@/lib/billing"
import { missingStripeVariables, stripeConfig } from "@/lib/stripe"

// The only place the plan changes. Every event only tells us which customer to look at: the state
// is read from Stripe again, so duplicates and events out of order end on the current state.
// Logs carry the event type and id, never the payload: it holds names and emails.
export async function POST(request: Request) {
  const config = stripeConfig()
  if (!config) {
    // 503: Stripe retries for three days, so events are not lost while the keys are being set.
    console.error(`Stripe webhook: payments are off, missing ${missingStripeVariables().join(", ")}`)
    return new Response("Payments are not configured", { status: 503 })
  }

  let event: Stripe.Event
  try {
    event = config.client.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      config.webhookSecret
    )
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const customerId = customerOf(event)
  if (!customerId) return Response.json({ received: true })

  // Errors reach Stripe as a 500 and the event comes back later.
  const result = await syncCustomer(config.client, config.priceId, customerId)
  if (result === "unknown_customer") console.warn(`Stripe webhook: ${event.type} ${event.id} for a customer no workspace has`)
  return Response.json({ received: true })
}

function customerOf(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
    case "invoice.paid":
    case "invoice.payment_failed": {
      const customer = event.data.object.customer
      return typeof customer === "string" ? customer : (customer?.id ?? null)
    }
    default:
      return null
  }
}
