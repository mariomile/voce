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
      signInWithPassword: async () =>
        auth.error ? { data: { user: null }, error: auth.error } : { data: { user: { id: "u-1" } }, error: null },
    },
  }),
}))
vi.mock("@/lib/origin", () => ({ getOrigin: async () => "https://voce.test" }))
const tracked = vi.hoisted(() => [] as unknown[])
vi.mock("@/lib/analytics", () => ({ trackMilestone: (_: unknown, milestone: unknown) => tracked.push(milestone) }))
vi.mock("@/lib/supabase/admin", () => ({ workspaceOfUser: async () => "ws-1" }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect ${path}`)
  },
}))

const { signIn, signUp } = await import("./actions")

describe("signIn", () => {
  const credentials = () => {
    const data = new FormData()
    data.set("email", "nuovo@test.voce")
    data.set("password", "password-lunga")
    return data
  }

  // A confirmation link opened in another browser confirms the email without a session: the first
  // sign-in is where that account starts. The event leaves once per workspace (analytics_milestones).
  it("counts an email sign-up at sign-in, and lands in the app", async () => {
    auth.error = null
    tracked.length = 0
    await expect(signIn(credentials())).rejects.toThrow("redirect /themes")
    expect(tracked).toEqual([{ event: "signed_up", properties: { method: "email" } }])
  })

  it("counts nothing when the credentials are wrong", async () => {
    auth.error = { code: "invalid_credentials" }
    tracked.length = 0
    expect(await signIn(credentials())).toEqual({ error: "Email o password non corretti." })
    expect(tracked).toEqual([])
  })
})

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

  it("puts an address Supabase cannot send to on the email field", async () => {
    auth.error = { code: "email_address_invalid" }
    expect(await signUp(form())).toEqual({ error: "Controlla l'indirizzo email.", field: "email" })
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
