import { renderToStaticMarkup } from "react-dom/server"
import { createTranslator } from "use-intl/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { messages } from "@/i18n/messages/index"

// The plan rows where the PM chooses a plan: the landing page and /billing. Numbers from PLAN_LIMITS.
// Rendered in Italian and in English: the next-intl stand-in follows ui.locale here.
const ui = vi.hoisted(() => ({ locale: "it" as "it" | "en" }))
const translator = (namespace?: string) =>
  createTranslator({ locale: ui.locale, timeZone: "Europe/Rome", messages: messages[ui.locale], namespace: namespace as never })
vi.mock("next-intl", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl")>()),
  useTranslations: (namespace?: string) => translator(namespace),
  useLocale: () => ui.locale,
}))
vi.mock("next-intl/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-intl/server")>()),
  getTranslations: async (namespace?: string) => translator(namespace),
  getLocale: async () => ui.locale,
}))
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

const billingHtml = async () => renderToStaticMarkup(await BillingPage({ searchParams: Promise.resolve({}) } as never))
const count = (html: string, text: string) => html.split(text).length - 1

beforeEach(() => {
  ui.locale = "it"
})

describe("plan rows", () => {
  it("the landing shows the question quota of Free and Pro", () => {
    const html = renderToStaticMarkup(<LandingPage />)
    expect(html).toContain("10 domande ai feedback al mese")
    expect(html).toContain("100 domande ai feedback al mese")
  })

  it("/billing shows the question quota of Free and Pro", async () => {
    const html = await billingHtml()
    expect(html).toContain("10 domande ai feedback al mese")
    expect(html).toContain("100 domande ai feedback al mese")
  })

  it("billing and landing show the verdict line in Free and Pro, in Italian and English", async () => {
    expect(count(renderToStaticMarkup(<LandingPage />), "Il verdetto delle ipotesi usa 1 analisi")).toBe(2)
    expect(count(await billingHtml(), "Il verdetto delle ipotesi usa 1 analisi")).toBe(2)
    ui.locale = "en"
    expect(count(renderToStaticMarkup(<LandingPage />), "The hypothesis verdict uses 1 analysis")).toBe(2)
    expect(count(await billingHtml(), "The hypothesis verdict uses 1 analysis")).toBe(2)
  })
})
