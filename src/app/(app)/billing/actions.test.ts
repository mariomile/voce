import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The actions run as a fresh test user against the local database. Stripe is fake: no call leaves the machine.
const session = vi.hoisted(() => ({ client: null as unknown }))
const fake = vi.hoisted(() => ({ configured: true, subscriptions: [] as unknown[], openCheckouts: [] as { id: string }[] }))
const stripeClient = vi.hoisted(() => ({
  customers: { create: null as unknown as ReturnType<typeof vi.fn> },
  checkout: {
    sessions: {
      create: null as unknown as ReturnType<typeof vi.fn>,
      list: null as unknown as ReturnType<typeof vi.fn>,
      expire: null as unknown as ReturnType<typeof vi.fn>,
    },
  },
  billingPortal: { sessions: { create: null as unknown as ReturnType<typeof vi.fn> } },
  subscriptions: { list: null as unknown as ReturnType<typeof vi.fn> },
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }))
vi.mock("@/lib/origin", () => ({ getOrigin: async () => "http://localhost:3000" }))
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`)
  },
}))
vi.mock("@/lib/stripe", () => ({
  stripeConfig: () => (fake.configured ? { client: stripeClient, webhookSecret: "whsec_x", priceId: "price_pro" } : null),
}))

const { openPortal, startCheckout } = await import("./actions")

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("billing")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  session.client = user.client
  fake.configured = true
  fake.subscriptions = []
  fake.openCheckouts = []
  let customers = 0
  stripeClient.customers.create = vi.fn(async () => ({ id: `cus_test_${user.workspaceId.slice(0, 8)}_${++customers}` }))
  stripeClient.checkout.sessions.create = vi.fn(async () => ({ url: "https://checkout.stripe.com/c/pay/cs_test_1" }))
  stripeClient.checkout.sessions.list = vi.fn(async () => ({ data: fake.openCheckouts }))
  stripeClient.checkout.sessions.expire = vi.fn(async (id: string) => ({ id, status: "expired" }))
  stripeClient.billingPortal.sessions.create = vi.fn(async () => ({ url: "https://billing.stripe.com/p/session/test_1" }))
  stripeClient.subscriptions.list = vi.fn(async () => ({ data: fake.subscriptions }))
  await admin
    .from("subscriptions")
    .update({ plan: "free", stripe_customer_id: null, stripe_subscription_id: null, stripe_status: null })
    .eq("workspace_id", user.workspaceId)
  await admin.from("workspace_members").update({ role: "owner" }).eq("user_id", user.userId)
})

async function savedCustomer() {
  const { data } = await admin.from("subscriptions").select("plan, stripe_customer_id").eq("workspace_id", user.workspaceId).single()
  return data!
}

describe("startCheckout", () => {
  it("creates the Stripe customer once, then sends the owner to Checkout for the Pro price", async () => {
    await expect(startCheckout()).rejects.toThrow("redirect:https://checkout.stripe.com/c/pay/cs_test_1")
    const { stripe_customer_id, plan } = await savedCustomer()
    expect(stripe_customer_id).toMatch(/^cus_test_/)
    // Going to Checkout changes nothing: only the webhook makes the workspace Pro.
    expect(plan).toBe("free")
    expect(stripeClient.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { workspace_id: user.workspaceId } })
    )
    expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer: stripe_customer_id,
        client_reference_id: user.workspaceId,
        line_items: [{ price: "price_pro", quantity: 1 }],
        success_url: "http://localhost:3000/billing?checkout=done",
        cancel_url: "http://localhost:3000/billing",
      })
    )

    // Back without paying, and again: same customer.
    await expect(startCheckout()).rejects.toThrow("redirect:")
    expect(stripeClient.customers.create).toHaveBeenCalledTimes(1)
    expect(stripeClient.checkout.sessions.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ customer: stripe_customer_id })
    )
  })

  it("a new Checkout closes the one left open in another tab, so only one can be paid", async () => {
    await admin.from("subscriptions").update({ stripe_customer_id: "cus_test_tabs" }).eq("workspace_id", user.workspaceId)
    fake.openCheckouts = [{ id: "cs_test_other_tab" }]
    await expect(startCheckout()).rejects.toThrow("redirect:")
    expect(stripeClient.checkout.sessions.list).toHaveBeenCalledWith({ customer: "cus_test_tabs", status: "open", limit: 100 })
    expect(stripeClient.checkout.sessions.expire).toHaveBeenCalledWith("cs_test_other_tab")
    expect(stripeClient.checkout.sessions.create).toHaveBeenCalledOnce()
  })

  it("two first clicks together save one Stripe customer, and both Checkouts use it", async () => {
    await Promise.allSettled([startCheckout(), startCheckout()])
    const { stripe_customer_id } = await savedCustomer()
    const customers = stripeClient.checkout.sessions.create.mock.calls.map(([params]) => params.customer)
    expect(customers).toEqual([stripe_customer_id, stripe_customer_id])
  })

  it("does not open a second Checkout on a Pro workspace", async () => {
    await admin.from("subscriptions").update({ plan: "pro", stripe_customer_id: "cus_test_pro" }).eq("workspace_id", user.workspaceId)
    expect(await startCheckout()).toEqual({ ok: false, reason: "already_pro" })
    expect(stripeClient.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it("does not charge twice when Stripe has the payment and the webhook is not here yet", async () => {
    await admin.from("subscriptions").update({ stripe_customer_id: "cus_test_paid" }).eq("workspace_id", user.workspaceId)
    fake.subscriptions = [{ status: "active", created: 1, items: { data: [{ price: { id: "price_pro" } }] } }]
    expect(await startCheckout()).toEqual({ ok: false, reason: "pending" })
    expect(stripeClient.checkout.sessions.create).not.toHaveBeenCalled()
    expect((await savedCustomer()).plan).toBe("free")
  })

  it("without the Stripe keys stays Free and calls nothing", async () => {
    fake.configured = false
    expect(await startCheckout()).toEqual({ ok: false, reason: "not_configured" })
    expect(stripeClient.customers.create).not.toHaveBeenCalled()
  })

  it("only the owner can start it", async () => {
    await admin.from("workspace_members").update({ role: "member" }).eq("user_id", user.userId)
    expect(await startCheckout()).toEqual({ ok: false, reason: "not_owner" })
    expect(await openPortal()).toEqual({ ok: false, reason: "not_owner" })
    expect(stripeClient.customers.create).not.toHaveBeenCalled()
  })

  it("a Stripe error becomes a message, not a crash", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    stripeClient.checkout.sessions.create = vi.fn(async () => {
      throw new Error("No such price: 'price_pro'")
    })
    expect(await startCheckout()).toEqual({ ok: false, reason: "failed" })
  })
})

describe("openPortal", () => {
  it("sends the owner to the Stripe portal of their own customer", async () => {
    await admin.from("subscriptions").update({ plan: "pro", stripe_customer_id: "cus_test_portal" }).eq("workspace_id", user.workspaceId)
    await expect(openPortal()).rejects.toThrow("redirect:https://billing.stripe.com/p/session/test_1")
    expect(stripeClient.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_test_portal",
      return_url: "http://localhost:3000/billing",
      locale: "it",
    })
  })

  it("has nothing to open before the first Checkout", async () => {
    expect(await openPortal()).toEqual({ ok: false, reason: "no_customer" })
    expect(stripeClient.billingPortal.sessions.create).not.toHaveBeenCalled()
  })
})
