import { describe, expect, it, vi } from "vitest"

// Only what Supabase Auth answers matters here: the client returns a chosen error.
const auth = vi.hoisted(() => ({ error: null as { code: string } | null, signUpArgs: [] as unknown[] }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signUp: async (args: unknown) => {
        auth.signUpArgs.push(args)
        return { error: auth.error }
      },
    },
  }),
}))
vi.mock("@/lib/origin", () => ({ getOrigin: async () => "https://voce.test" }))

const { signUp } = await import("./actions")

function form() {
  const data = new FormData()
  data.set("workspace", "Prova")
  data.set("email", "nuovo@test.voce")
  data.set("password", "password-lunga")
  return data
}

describe("signUp", () => {
  it.each([
    ["workspace", "", "Scrivi il nome del prodotto, al massimo 60 caratteri."],
    ["email", "non-una-email", "Controlla l'indirizzo email."],
    ["password", "corta", "La password deve avere almeno 8 caratteri."],
  ])("says which field is wrong: %s", async (field, value, error) => {
    const data = form()
    data.set(field, value)
    expect(await signUp(data)).toEqual({ error, field })
  })

  it("puts a weak password on the password field", async () => {
    auth.error = { code: "weak_password" }
    expect(await signUp(form())).toEqual({ error: "Questa password è troppo debole, scegline un'altra.", field: "password" })
  })

  it.each(["signup_disabled", "email_provider_disabled"])("says sign-ups are closed on %s", async (code) => {
    auth.error = { code }
    expect(await signUp(form())).toEqual({ error: "Le registrazioni sono chiuse in questo momento." })
  })

  it("keeps the generic error for anything else", async () => {
    auth.error = { code: "unexpected_failure" }
    expect(await signUp(form())).toEqual({ error: "Qualcosa non ha funzionato. Riprova tra poco." })
  })

  it("asks Supabase to send the confirmation link back to the app's callback", async () => {
    auth.error = null
    auth.signUpArgs.length = 0
    await signUp(form())
    expect(auth.signUpArgs).toEqual([
      {
        email: "nuovo@test.voce",
        password: "password-lunga",
        options: {
          emailRedirectTo: "https://voce.test/auth/callback?flow=signup",
          data: { workspace_name: "Prova" },
        },
      },
    ])
  })

  it("sends the email when sign-ups are open", async () => {
    auth.error = null
    expect(await signUp(form())).toEqual({ sentTo: "nuovo@test.voce" })
  })
})
