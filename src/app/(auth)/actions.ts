"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { z } from "zod"
import { trackMilestone } from "@/lib/analytics"
import { getOrigin } from "@/lib/origin"
import { workspaceOfUser } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type AuthField = "workspace" | "email" | "password"
// `field` says which field the error is about, so the form shows it there.
export type AuthState = { error?: string; field?: AuthField; sentTo?: string }

const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
})

export async function signIn(formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth.errors")
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: t("missingCredentials") }
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error?.code === "invalid_credentials") return { error: t("invalidCredentials") }
  if (error?.code === "email_not_confirmed")
    return { error: t("emailNotConfirmed") }
  if (error) return { error: t("generic") }
  // A confirmation link opened in another browser confirms the email but gives no session: the account
  // starts at this first sign-in. The event leaves only once per workspace.
  const userId = data.user.id
  trackMilestone(() => workspaceOfUser(userId), { event: "signed_up", properties: { method: "email" } })
  redirect("/research")
}

const signUpSchema = z.object({
  workspace: z.string().trim().min(1).max(60),
  email: z.email().max(254),
  password: z.string().min(8).max(72),
})

export async function signUp(formData: FormData): Promise<AuthState> {
  const t = await getTranslations("auth.errors")
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    if (field === "password") return { error: t("passwordTooShort"), field }
    if (field === "email") return { error: t("checkEmail"), field }
    return { error: t("workspaceName"), field: "workspace" }
  }
  const supabase = await createClient()
  // The workspace is created by a database trigger, with this name. Supabase's default email template
  // links to its verify endpoint, which sends the user to emailRedirectTo with a code: without it, to the
  // landing page. The custom template links to /auth/confirm instead.
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await getOrigin()}/auth/callback?flow=signup`,
      data: { workspace_name: parsed.data.workspace },
    },
  })
  // Turned off in Supabase Auth: all sign-ups, or the email ones.
  if (error?.code === "signup_disabled" || error?.code === "email_provider_disabled")
    return { error: t("signupsClosed") }
  // Supabase refuses to send to an address with no mail server behind it.
  if (error?.code === "email_address_invalid") return { error: t("checkEmail"), field: "email" }
  if (error?.code === "weak_password")
    return { error: t("weakPassword"), field: "password" }
  if (error?.code === "over_email_send_rate_limit")
    return { error: t("rateLimited") }
  if (error) return { error: t("generic") }
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
