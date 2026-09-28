import { describe, expect, it } from "vitest"
import { localeFromAcceptLanguage, pinnedLocale, resolveLocale } from "./locale"

describe("localeFromAcceptLanguage", () => {
  it.each([
    ["en-US,en;q=0.9", "en"],
    ["it-IT,it;q=0.9,en;q=0.8", "it"],
    ["de-DE,en;q=0.7,it;q=0.8", "it"],
    ["fr-FR,en-GB;q=0.5", "en"],
    ["EN", "en"],
    ["en;q=0,it", "it"],
  ])("%s → %s", (header, locale) => {
    expect(localeFromAcceptLanguage(header)).toBe(locale)
  })

  it.each([[null], [""], ["de-DE,fr;q=0.8"], ["*"]])("%s → nothing supported", (header) => {
    expect(localeFromAcceptLanguage(header)).toBeUndefined()
  })
})

describe("resolveLocale", () => {
  it("defaults to Italian with no cookie and no browser language", () => {
    expect(resolveLocale({ cookie: undefined, acceptLanguage: null })).toBe("it")
  })

  it("follows the browser language on the first visit", () => {
    expect(resolveLocale({ cookie: undefined, acceptLanguage: "en-US,en;q=0.9" })).toBe("en")
  })

  it("keeps the language chosen in the switch over the browser language", () => {
    expect(resolveLocale({ cookie: "it", acceptLanguage: "en-US" })).toBe("it")
    expect(resolveLocale({ cookie: "en", acceptLanguage: "it-IT" })).toBe("en")
  })

  it("ignores a cookie with an unsupported value", () => {
    expect(resolveLocale({ cookie: "fr", acceptLanguage: "en" })).toBe("en")
    expect(resolveLocale({ cookie: "fr", acceptLanguage: null })).toBe("it")
  })
})

describe("pinnedLocale", () => {
  it("pins the public form to Italian, whatever the browser or the switch say", () => {
    expect(pinnedLocale("/f/phc26")).toBe("it")
  })

  it("leaves every other page to the cookie and the browser", () => {
    for (const path of ["/", "/login", "/themes", "/sala", "/collect", "/f", "/features"])
      expect(pinnedLocale(path)).toBeUndefined()
  })
})
