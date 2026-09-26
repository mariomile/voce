import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The plan rows where the PM chooses a plan: the landing page and /billing. Numbers from PLAN_LIMITS.
vi.mock("@/lib/data", () => ({
  getCurrentWorkspace: async () => ({ id: "ws", name: "Acme" }),
  getBilling: async () => ({
    plan: "free",
    stripeCustomerId: null,
    stripeStatus: null,
    currentPeriodEnd: null,
    cancelAt: null,
    isOwner: true,
  }),
}))
vi.mock("@/lib/stripe", () => ({ stripeConfig: () => null }))

const { default: LandingPage } = await import("@/app/page")
const { default: BillingPage } = await import("@/app/(app)/billing/page")

describe("plan rows", () => {
  it("the landing shows the question quota of Free and Pro", () => {
    const html = renderToStaticMarkup(<LandingPage />)
    expect(html).toContain("10 domande ai feedback al mese")
    expect(html).toContain("100 domande ai feedback al mese")
  })

  it("/billing shows the question quota of Free and Pro", async () => {
    const page = await BillingPage({ searchParams: Promise.resolve({}) } as never)
    const html = renderToStaticMarkup(page)
    expect(html).toContain("10 domande ai feedback al mese")
    expect(html).toContain("100 domande ai feedback al mese")
  })
})
