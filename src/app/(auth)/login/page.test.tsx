import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ open: true }))
vi.mock("@/lib/auth", () => ({ areSignupsOpen: async () => auth.open }))
vi.mock("@/components/google-sign-in", () => ({ GoogleSignIn: () => null }))
vi.mock("@/app/(auth)/actions", () => ({ signIn: async () => ({}) }))
const { default: LoginPage } = await import("./page")

const render = async () => renderToStaticMarkup(await LoginPage({ searchParams: Promise.resolve({}) } as never))

// Existing accounts still log in; below the form, the way in for everyone else.
describe("the login page", () => {
  it("leads to sign-up while sign-ups are open", async () => {
    auth.open = true
    const html = await render()
    expect(html).toContain('id="email"')
    expect(html).toContain('href="/signup"')
  })

  it("keeps the form and points to Mario when access is closed", async () => {
    auth.open = false
    const html = await render()
    expect(html).toContain('id="email"')
    expect(html).not.toContain('href="/signup"')
    expect(html).toContain("Gli accessi sono chiusi per ora.")
    expect(html).toContain('href="mailto:mario@buildrs.xyz?subject=Voce"')
  })
})
