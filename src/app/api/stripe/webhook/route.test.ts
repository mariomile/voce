import Stripe from "stripe"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The webhook runs for real against the local database, with a real signature check.
// Only Stripe's answer to "which subscriptions does this customer have" is fake.
const WEBHOOK_SECRET = "whsec_test_voce"
const stripe = new Stripe("sk_test_voce_fake")
const fake = vi.hoisted(() => ({
  configured: true,
  // What Stripe says now, per customer.
  subscriptions: new Map<string, unknown[]>(),
  list: null as unknown as ReturnType<typeof vi.fn>,
}))
fake.list = vi.fn(async ({ customer }: { customer: string }) => ({ data: fake.subscriptions.get(customer) ?? [] }))
vi.mock("@/lib/stripe", () => ({
  stripeConfig: () =>
    fake.configured
      ? { client: { webhooks: stripe.webhooks, subscriptions: { list: fake.list } }, webhookSecret: WEBHOOK_SECRET, priceId: "price_pro" }
      : null,
  missingStripeVariables: () => ["STRIPE_SECRET_KEY"],
}))

// Which activation events the action asks for. Sending them is tested in src/lib/analytics.test.ts.
const analytics = vi.hoisted(() => ({ trackMilestone: vi.fn() }))
vi.mock("@/lib/analytics", () => analytics)

const { POST } = await import("./route")

let user: TestUser
let customer: string
const DAY = 24 * 60 * 60
const now = Math.floor(Date.now() / 1000)

beforeAll(async () => {
  user = await createTestUser("webhook")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  fake.configured = true
  fake.subscriptions.clear()
  fake.list.mockClear()
  vi.spyOn(console, "warn").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
  customer = `cus_test_${crypto.randomUUID().slice(0, 8)}`
  await admin
    .from("subscriptions")
    .update({
      plan: "free",
      stripe_customer_id: customer,
      stripe_subscription_id: null,
      stripe_status: null,
      current_period_end: null,
      cancel_at: null,
      stripe_synced_at: null,
    })
    .eq("workspace_id", user.workspaceId)
})

function subscription(
  id: string,
  status: Stripe.Subscription.Status,
  { created = now, periodEnd = now + 30 * DAY, cancelAtPeriodEnd = false, price = "price_pro" } = {}
) {
  return {
    id,
    object: "subscription",
    customer,
    status,
    created,
    cancel_at: cancelAtPeriodEnd ? periodEnd : null,
    cancel_at_period_end: cancelAtPeriodEnd,
    items: { object: "list", data: [{ id: `si_${id}`, current_period_end: periodEnd, price: { id: price } }] },
  }
}

function event(type: string, object: Record<string, unknown>, { id = `evt_${crypto.randomUUID()}`, created = now } = {}) {
  return JSON.stringify({ id, object: "event", type, created, livemode: false, api_version: "2026-08-26.dahlia", data: { object } })
}

function send(payload: string, signature: string | null = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET })) {
  const headers = new Headers({ "content-type": "application/json" })
  if (signature !== null) headers.set("stripe-signature", signature)
  return POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers }))
}

async function billing() {
  const { data } = await admin
    .from("subscriptions")
    .select("plan, stripe_subscription_id, stripe_status, current_period_end, cancel_at")
    .eq("workspace_id", user.workspaceId)
    .single()
  return data!
}

const checkoutCompleted = () =>
  event("checkout.session.completed", { id: "cs_test_1", object: "checkout.session", customer, subscription: "sub_1" })

describe("signature", () => {
  it("a valid signature makes the workspace Pro, with the data read from Stripe", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "active", { periodEnd: now + 30 * DAY })])
    const response = await send(checkoutCompleted())
    expect(response.status).toBe(200)
    expect(fake.list).toHaveBeenCalledWith({ customer, status: "all", limit: 100 })
    const saved = await billing()
    expect(saved).toMatchObject({ plan: "pro", stripe_subscription_id: "sub_1", stripe_status: "active", cancel_at: null })
    expect(Date.parse(saved.current_period_end!)).toBe((now + 30 * DAY) * 1000)
  })

  it("an invalid signature is refused and nothing changes", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "active")])
    const payload = checkoutCompleted()
    const wrongSecret = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_someone_else" })
    const otherPayload = stripe.webhooks.generateTestHeaderString({ payload: payload.replace("cs_test_1", "cs_test_2"), secret: WEBHOOK_SECRET })
    const old = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET, timestamp: now - 3600 })
    for (const signature of [wrongSecret, otherPayload, old, "t=1,v1=abc", "", null]) {
      expect((await send(payload, signature)).status).toBe(400)
    }
    expect(fake.list).not.toHaveBeenCalled()
    expect((await billing()).plan).toBe("free")
  })

  it("without the Stripe keys the webhook answers 503, so Stripe tries again later", async () => {
    fake.configured = false
    fake.subscriptions.set(customer, [subscription("sub_1", "active")])
    expect((await send(checkoutCompleted())).status).toBe(503)
    expect((await billing()).plan).toBe("free")
  })
})

describe("analytics", () => {
  it("asks for the upgrade event when a save makes the workspace Pro, not when it stays Free", async () => {
    analytics.trackMilestone.mockClear()
    fake.subscriptions.set(customer, [subscription("sub_1", "incomplete")])
    await send(checkoutCompleted())
    expect(analytics.trackMilestone).not.toHaveBeenCalled()
    fake.subscriptions.set(customer, [subscription("sub_1", "active")])
    await send(checkoutCompleted())
    expect(analytics.trackMilestone).toHaveBeenCalledExactlyOnceWith(user.workspaceId, {
      event: "upgraded_to_pro",
      properties: {},
    })
  })
})

describe("duplicates and order", () => {
  it("the same event twice leaves the same state", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "active")])
    const payload = checkoutCompleted()
    expect((await send(payload)).status).toBe(200)
    const first = await billing()
    expect((await send(payload)).status).toBe(200)
    expect(await billing()).toEqual(first)
    expect(first.plan).toBe("pro")
  })

  it("a late event from before the cancellation does not bring Pro back", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "canceled")])
    const deleted = event("customer.subscription.deleted", subscription("sub_1", "canceled"), { created: now })
    // Sent earlier, when the subscription was active, and delivered late.
    const created = event("customer.subscription.created", subscription("sub_1", "active"), { created: now - DAY })
    expect((await send(deleted)).status).toBe(200)
    expect((await send(created)).status).toBe(200)
    expect(await billing()).toMatchObject({ plan: "free", stripe_status: "canceled" })
  })

  it("the event content is never trusted: only Stripe's current state counts", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "incomplete")])
    await send(event("customer.subscription.updated", subscription("sub_1", "active")))
    expect(await billing()).toMatchObject({ plan: "free", stripe_status: "incomplete" })
  })

  it("two webhooks at once: a read that started earlier and finished later does not overwrite", async () => {
    // A reads while the payment is still incomplete and answers slowly; B reads after the payment.
    let releaseA!: () => void
    fake.list.mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => (releaseA = resolve))
      return { data: [subscription("sub_1", "incomplete")] }
    })
    fake.subscriptions.set(customer, [subscription("sub_1", "active")])
    const a = send(event("customer.subscription.created", subscription("sub_1", "incomplete")))
    await vi.waitFor(() => expect(releaseA).toBeDefined())
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect((await send(event("invoice.paid", { id: "in_1", object: "invoice", customer }))).status).toBe(200)
    releaseA()
    expect((await a).status).toBe(200)
    expect(await billing()).toMatchObject({ plan: "pro", stripe_status: "active" })
  })

  it("only the Pro price gives Pro", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "active", { price: "price_something_else" })])
    await send(checkoutCompleted())
    expect(await billing()).toMatchObject({ plan: "free", stripe_subscription_id: "sub_1", stripe_status: "active" })
  })

  it("a new subscription after a cancelled one stays Pro, even with late events of the old one", async () => {
    fake.subscriptions.set(customer, [
      subscription("sub_old", "canceled", { created: now - 60 * DAY }),
      subscription("sub_new", "active", { created: now }),
    ])
    await send(event("customer.subscription.created", subscription("sub_new", "active")))
    await send(event("customer.subscription.deleted", subscription("sub_old", "canceled")))
    expect(await billing()).toMatchObject({ plan: "pro", stripe_subscription_id: "sub_new" })
  })
})

describe("cancellation", () => {
  it("cancelled at period end: Pro until that date, then Free when Stripe closes it", async () => {
    const periodEnd = now + 12 * DAY
    fake.subscriptions.set(customer, [subscription("sub_1", "active", { periodEnd, cancelAtPeriodEnd: true })])
    await send(event("customer.subscription.updated", subscription("sub_1", "active", { periodEnd, cancelAtPeriodEnd: true })))
    const scheduled = await billing()
    expect(scheduled).toMatchObject({ plan: "pro", stripe_status: "active" })
    expect(Date.parse(scheduled.cancel_at!)).toBe(periodEnd * 1000)

    fake.subscriptions.set(customer, [subscription("sub_1", "canceled", { periodEnd, cancelAtPeriodEnd: true })])
    await send(event("customer.subscription.deleted", subscription("sub_1", "canceled")))
    expect(await billing()).toMatchObject({ plan: "free", stripe_status: "canceled", cancel_at: null })
  })

  it("back to Free, the workspace keeps its feedback but takes no more than 100", async () => {
    const rows = Array.from({ length: 101 }, (_, i) => ({ workspace_id: user.workspaceId, text: `Feedback ${i}`, channel: "Supporto" }))
    fake.subscriptions.set(customer, [subscription("sub_1", "active")])
    await send(checkoutCompleted())
    expect((await admin.from("feedback").insert(rows)).error).toBeNull()

    fake.subscriptions.set(customer, [subscription("sub_1", "canceled")])
    await send(event("customer.subscription.deleted", subscription("sub_1", "canceled")))
    const { count } = await admin.from("feedback").select("id", { count: "exact", head: true }).eq("workspace_id", user.workspaceId)
    expect(count).toBe(101)
    const extra = await admin.from("feedback").insert({ workspace_id: user.workspaceId, text: "Uno in più", channel: "Supporto" })
    expect(extra.error?.message).toBe("feedback_limit_reached")
    await admin.from("feedback").delete().eq("workspace_id", user.workspaceId)
  })

  it("keeps Pro while Stripe retries a failed payment, drops it when the invoice stays unpaid", async () => {
    fake.subscriptions.set(customer, [subscription("sub_1", "past_due")])
    await send(event("invoice.payment_failed", { id: "in_1", object: "invoice", customer }))
    expect(await billing()).toMatchObject({ plan: "pro", stripe_status: "past_due" })

    fake.subscriptions.set(customer, [subscription("sub_1", "unpaid")])
    await send(event("customer.subscription.updated", subscription("sub_1", "unpaid")))
    expect(await billing()).toMatchObject({ plan: "free", stripe_status: "unpaid" })
  })
})

describe("events that change nothing", () => {
  it("a customer no workspace has is acknowledged and ignored", async () => {
    const stranger = "cus_test_stranger"
    fake.subscriptions.set(stranger, [subscription("sub_x", "active")])
    const response = await send(event("checkout.session.completed", { id: "cs_x", object: "checkout.session", customer: stranger }))
    expect(response.status).toBe(200)
    expect((await billing()).plan).toBe("free")
  })

  it("other event types are acknowledged without asking Stripe", async () => {
    const response = await send(event("customer.created", { id: customer, object: "customer" }))
    expect(response.status).toBe(200)
    expect(fake.list).not.toHaveBeenCalled()
  })

  it("if Stripe cannot be read, answers 500 so the event comes back, and nothing changes", async () => {
    fake.list.mockRejectedValueOnce(new Error("Stripe is down"))
    await expect(send(checkoutCompleted())).rejects.toThrow("Stripe is down")
    expect((await billing()).plan).toBe("free")
  })
})
