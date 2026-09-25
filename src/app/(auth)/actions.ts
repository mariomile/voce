"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export type AuthState = { error?: string; sentTo?: string }

const GENERIC_ERROR = "Qualcosa non ha funzionato. Riprova tra poco."

const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
})

export async function signIn(formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Inserisci email e password." }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error?.code === "invalid_credentials") return { error: "Email o password non corretti." }
  if (error?.code === "email_not_confirmed")
    return { error: "Conferma prima l'email: apri il link che ti abbiamo mandato." }
  if (error) return { error: GENERIC_ERROR }
  redirect("/themes")
}

const signUpSchema = z.object({
  workspace: z.string().trim().min(1).max(60),
  email: z.email().max(254),
  password: z.string().min(8).max(72),
})

export async function signUp(formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    if (field === "password") return { error: "La password deve avere almeno 8 caratteri." }
    if (field === "email") return { error: "Controlla l'indirizzo email." }
    return { error: "Scrivi il nome del prodotto, al massimo 60 caratteri." }
  }
  const supabase = await createClient()
  // The workspace is created by a database trigger, with this name.
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { workspace_name: parsed.data.workspace } },
  })
  if (error?.code === "weak_password") return { error: "Questa password è troppo debole, scegline un'altra." }
  if (error?.code === "over_email_send_rate_limit")
    return { error: "Troppi tentativi con questa email. Riprova tra qualche minuto." }
  if (error) return { error: GENERIC_ERROR }
  // Same answer whether or not the email already had an account, so nobody can probe for users.
  return { sentTo: parsed.data.email }
}

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin")
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error || !data.url) redirect("/login?error=google")
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
