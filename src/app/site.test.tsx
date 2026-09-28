import { existsSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

const session = { signedIn: false }
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: session.signedIn ? { claims: { sub: "u" } } : null }) },
  }),
}))

// What a browser or a crawler asks of every site: an icon, robots.txt, a 404 in the app's language.
describe("site files", () => {
  it("has an app icon", () => {
    expect(existsSync(new URL("./icon.svg", import.meta.url))).toBe(true)
  })

  it("robots.txt keeps crawlers out of the app, the auth callbacks and the public forms", async () => {
    const { default: robots } = await import("@/app/robots")
    const rules = robots().rules
    const rule = Array.isArray(rules) ? rules[0] : rules
    expect(rule.allow).toBe("/")
    for (const path of ["/research", "/billing", "/auth/", "/f/", "/api/"])
      expect(rule.disallow).toContain(path)
  })

  it("the 404 page speaks the app's language and leads back home", async () => {
    session.signedIn = false
    const { default: NotFound } = await import("@/app/not-found")
    const html = renderToStaticMarkup(await NotFound())
    expect(html).toContain("Questa pagina non esiste.")
    expect(html).toContain("Torna alla home")
    expect(html).toContain('href="/"')
    expect(html).not.toContain("could not be found")
  })

  it("signed in, the 404 page leads back to the Research", async () => {
    session.signedIn = true
    const { default: NotFound } = await import("@/app/not-found")
    const html = renderToStaticMarkup(await NotFound())
    expect(html).toContain('href="/research"')
    expect(html).toContain("Tutte le Research")
  })
})
