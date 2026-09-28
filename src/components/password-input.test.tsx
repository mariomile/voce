import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PasswordInput } from "./password-input"

// The markup a screen reader and a password manager see before any click. The toggle itself runs in the E2E.

describe("PasswordInput", () => {
  const markup = renderToStaticMarkup(
    <PasswordInput id="password" name="password" autoComplete="current-password" aria-describedby="password-hint" required />
  )

  it("starts hidden, with the input's own attributes", () => {
    expect(markup).toMatch(/<input[^>]*type="password"/)
    for (const attr of ['id="password"', 'name="password"', 'autoComplete="current-password"', "required"])
      expect(markup).toContain(attr)
  })

  it("has a real button that shows the password, is not pressed, controls the input and never submits", () => {
    const button = markup.match(/<button[^>]*>/)![0]
    for (const attr of ['type="button"', 'aria-label="Mostra password"', 'aria-pressed="false"', 'aria-controls="password"'])
      expect(button).toContain(attr)
  })

  it("keeps the descriptions it is given, and has a live region for the Caps Lock warning", () => {
    expect(markup).toContain('aria-describedby="password-hint"')
    expect(markup).toMatch(/<p[^>]*id="password-caps"[^>]*aria-live="polite"/)
  })
})
