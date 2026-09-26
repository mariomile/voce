import { describe, expect, it, vi } from "vitest"

// Only what Supabase Auth answers matters here: the client returns a chosen error.
const auth = vi.hoisted(() => ({ error: null as { code: string } | null }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signUp: async () => ({ error: auth.error }) } }),
}))

const { signUp } = await import("./actions")

function form() {
  const data = new FormData()
  data.set("workspace", "Prova")
  data.set("email", "nuovo@test.voce")
  data.set("password", "password-lunga")
  return data
}

describe("signUp", () => {
  it.each(["signup_disabled", "email_provider_disabled"])("says sign-ups are closed on %s", async (code) => {
    auth.error = { code }
    expect(await signUp(form())).toEqual({ error: "Le registrazioni sono chiuse in questo momento." })
  })

  it("keeps the generic error for anything else", async () => {
    auth.error = { code: "unexpected_failure" }
    expect(await signUp(form())).toEqual({ error: "Qualcosa non ha funzionato. Riprova tra poco." })
  })

  it("sends the email when sign-ups are open", async () => {
    auth.error = null
    expect(await signUp(form())).toEqual({ sentTo: "nuovo@test.voce" })
  })
})
