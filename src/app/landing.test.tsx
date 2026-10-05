import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

const { default: LandingPage } = await import("./page")

// Access is closed: the landing asks visitors to write to Mario, and links neither sign-up nor log in.
describe("the landing page", () => {
  it("has no way into sign-up or log in, only the contact", () => {
    const html = renderToStaticMarkup(<LandingPage />)
    expect(html).not.toContain('href="/signup"')
    expect(html).not.toContain('href="/login"')
    expect(html.match(/href="mailto:mario@buildrs\.xyz\?subject=Voce"/g)?.length).toBeGreaterThanOrEqual(4)
    expect(html).toContain('href="https://www.linkedin.com/in/mariomiletta"')
    expect(html).toContain("Gli accessi sono chiusi per ora.")
  })
})
