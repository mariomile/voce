import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import ErrorPage from "./error"
import GlobalError from "./global-error"

// What shows instead of Next's English "This page couldn't load" when a page breaks: Voce's own page, in the
// app's language, with a way to try again and a way back.
const props = { error: new Error("boom"), reset: () => {}, retry: () => {} }

describe("the error page", () => {
  it("says what happened in Italian, with Riprova and the way back to the Research", () => {
    const html = renderToStaticMarkup(<ErrorPage {...props} />)
    expect(html).toContain("Qualcosa non ha funzionato.")
    expect(html).toMatch(/<button[^>]*>Riprova<\/button>/)
    expect(html).toMatch(/<a[^>]*href="\/research"[^>]*>Tutte le Research<\/a>/)
    // Never the error's own words.
    expect(html).not.toContain("boom")
  })

  it("the global one brings its own document, Italian until the browser says otherwise", () => {
    const html = renderToStaticMarkup(<GlobalError {...props} />)
    expect(html).toMatch(/^<html lang="it"/)
    expect(html).toContain("Qualcosa non ha funzionato.")
    expect(html).toMatch(/<button[^>]*>Riprova<\/button>/)
    expect(html).not.toContain("boom")
  })
})
