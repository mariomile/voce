import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { fieldProps } from "./auth-form"

vi.mock("@/app/(auth)/actions", () => ({ signIn: async () => ({}), signUp: async () => ({}) }))
const { LoginForm } = await import("./login-form")
const { SignupForm } = await import("./signup-form")

function input(markup: string, id: string) {
  return markup.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))![0]
}

describe("the email field", () => {
  it.each([
    ["login", renderToStaticMarkup(<LoginForm />)],
    ["signup", renderToStaticMarkup(<SignupForm />)],
  ])("on %s is an email field that phones and spell checkers leave alone", (_, markup) => {
    const email = input(markup, "email")
    for (const attr of [
      'type="email"',
      'autoComplete="email"',
      'inputMode="email"',
      'autoCapitalize="off"',
      'spellCheck="false"',
      "required",
    ])
      expect(email).toContain(attr)
  })
})

describe("the password field", () => {
  it("on login asks the password manager for the saved password", () => {
    const password = input(renderToStaticMarkup(<LoginForm />), "password")
    expect(password).toContain('autoComplete="current-password"')
    expect(password).toContain("required")
  })

  it("on sign-up asks for a new password and states the rule before submitting", () => {
    const markup = renderToStaticMarkup(<SignupForm />)
    const password = input(markup, "password")
    for (const attr of ['autoComplete="new-password"', 'minLength="8"', 'maxLength="72"', 'aria-describedby="password-hint"'])
      expect(password).toContain(attr)
    expect(markup).toMatch(/<p[^>]*id="password-hint"[^>]*>Almeno 8 caratteri\.<\/p>/)
  })
})

describe("fieldProps", () => {
  it("marks only the field the error is about, and links the error after the hint", () => {
    const state = { error: "Controlla l'indirizzo email.", field: "email" as const }
    expect(fieldProps(state, "email", "email-hint")).toEqual({
      id: "email",
      name: "email",
      "aria-invalid": true,
      "aria-describedby": "email-hint email-error",
    })
    expect(fieldProps(state, "password")).toEqual({ id: "password", name: "password" })
  })
})
