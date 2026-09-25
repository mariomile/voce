import "server-only"

import Stripe from "stripe"

// Payments are on only when all three variables are set in .env.local (or on Vercel).
// Without them the app stays Free and the Piano page says so.
export type StripeConfig = { client: Stripe; webhookSecret: string; priceId: string }

export function stripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const priceId = process.env.STRIPE_PRICE_ID
  if (!secretKey || !webhookSecret || !priceId) return null
  return { client: new Stripe(secretKey, { apiVersion: "2026-08-26.dahlia" }), webhookSecret, priceId }
}

export function missingStripeVariables() {
  return ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID"].filter((name) => !process.env[name])
}
