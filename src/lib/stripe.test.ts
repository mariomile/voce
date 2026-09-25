import { afterEach, describe, expect, it, vi } from "vitest"
import { missingStripeVariables, stripeConfig } from "./stripe"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("stripeConfig", () => {
  it("is off when any of the three variables is missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "rk_test_x")
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x")
    vi.stubEnv("STRIPE_PRICE_ID", "")
    expect(stripeConfig()).toBeNull()
    expect(missingStripeVariables()).toEqual(["STRIPE_PRICE_ID"])
  })

  it("is on with all three", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "rk_test_x")
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_x")
    vi.stubEnv("STRIPE_PRICE_ID", "price_x")
    expect(stripeConfig()).toMatchObject({ webhookSecret: "whsec_x", priceId: "price_x" })
    expect(missingStripeVariables()).toEqual([])
  })
})
