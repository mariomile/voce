import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The callback of Google and of the confirmation email sent with Supabase's default template.
// Supabase Auth answers what the test chooses; redirect() throws, as in Next.
const auth = vi.hoisted(() => ({ exchange: vi.fn() }))
const tracked = vi.hoisted(() => [] as unknown[])
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession: auth.exchange } }),
}))
vi.mock("@/lib/supabase/admin", () => ({ workspaceOfUser: async () => "ws-1" }))
vi.mock("@/lib/analytics", () => ({ trackMilestone: (_: unknown, milestone: unknown) => tracked.push(milestone) }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Redirect(path)
  },
}))
class Redirect extends Error {
  constructor(readonly path: string) {
    super(path)
  }
}

const { GET } = await import("./route")

async function landing(query: string) {
  try {
    await GET(new NextRequest(`https://voce.test/auth/callback${query}`))
  } catch (error) {
    if (error instanceof Redirect) return error.path
    throw error
  }
  throw new Error("no redirect")
}

beforeEach(() => {
  auth.exchange.mockReset()
  tracked.length = 0
})

describe("auth callback", () => {
  it("signs in from the confirmation email and lands in the app, tracking an email sign-up", async () => {
    auth.exchange.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null })
    expect(await landing("?code=abc&flow=signup")).toBe("/research")
    expect(auth.exchange).toHaveBeenCalledWith("abc")
    expect(tracked).toEqual([{ event: "signed_up", properties: { method: "email" } }])
  })

  it("signs in from Google and lands in the app, tracking a Google sign-up", async () => {
    auth.exchange.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null })
    expect(await landing("?code=abc")).toBe("/research")
    expect(tracked).toEqual([{ event: "signed_up", properties: { method: "google" } }])
  })

  it("says the email is confirmed when the link opens in another browser, without a code verifier", async () => {
    auth.exchange.mockResolvedValue({ data: { user: null, session: null }, error: { code: "pkce_code_verifier_not_found" } })
    expect(await landing("?code=abc&flow=signup")).toBe("/login?confirmed=1")
    expect(tracked).toEqual([])
  })

  it("keeps the Google error when the Google exchange fails", async () => {
    auth.exchange.mockResolvedValue({ data: { user: null, session: null }, error: { code: "bad_code_verifier" } })
    expect(await landing("?code=abc")).toBe("/login?error=link")
  })

  it("sends an expired or reused email link to the login with the link error", async () => {
    expect(await landing("?error=access_denied&error_code=otp_expired&flow=signup")).toBe("/login?error=link")
    expect(auth.exchange).not.toHaveBeenCalled()
  })
})
