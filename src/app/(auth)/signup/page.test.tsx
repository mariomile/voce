import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ open: true }))
vi.mock("@/lib/auth", () => ({ areSignupsOpen: async () => auth.open }))
vi.mock("next/server", () => ({ connection: async () => {} }))
vi.mock("@/components/google-sign-in", () => ({ GoogleSignIn: () => null }))
vi.mock("@/app/(auth)/actions", () => ({ signUp: async () => ({}) }))
const { default: SignupPage } = await import("./page")

// The page follows "Allow new users to sign up" in Supabase Auth.
describe("the sign-up page", () => {
  it("shows the form while sign-ups are open", async () => {
    auth.open = true
    const html = renderToStaticMarkup(await SignupPage())
    expect(html).toContain("Crea il tuo workspace")
    expect(html).toContain('id="email"')
  })

  it("says sign-ups are closed, with no form, and leads to log in", async () => {
    auth.open = false
    const html = renderToStaticMarkup(await SignupPage())
    expect(html).toContain("Le registrazioni sono chiuse")
    expect(html).not.toContain("<form")
    expect(html).toContain('href="/login"')
  })
})
