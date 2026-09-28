import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { expect, type Page } from "@playwright/test"

// Helpers for the end-to-end tests: the Mailpit inbox, and users and rows made with the secret key
// of the local Supabase (the same .env.local the app reads).

if (existsSync(".env.local")) process.loadEnvFile(".env.local")

// Mailpit listens 3 ports after the Supabase API (54321 → 54324, 55521 → 55524 on an isolated stack).
const MAILPIT = `http://127.0.0.1:${Number(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).port) + 3}`

export async function confirmationLink(email: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`)
    const { messages } = (await search.json()) as { messages: { ID: string }[] }
    if (messages.length > 0) {
      const message = await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)
      const { HTML } = (await message.json()) as { HTML: string }
      const href = HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1]
      if (href) return href.replaceAll("&amp;", "&")
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No confirmation email for ${email} in Mailpit`)
}

// The link Supabase's default template sends ({{ .ConfirmationURL }}), used in production while the
// custom template cannot be applied there: the verify endpoint, then back to the app with a code.
// Built from the token hash of the local email, which is the same token.
export async function defaultTemplateLink(email: string) {
  const tokenHash = new URL(await confirmationLink(email)).searchParams.get("token_hash")!
  const redirectTo = "http://localhost:3000/auth/callback?flow=signup"
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`
}

export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// A confirmed user with their own workspace and, unless { research: false }, one Research with its
// public form, signed in through the login page (which lands on /research).
export async function signedInUser(page: Page, label: string, options: { research?: boolean } = {}) {
  const email = `e2e-${label}-${crypto.randomUUID().slice(0, 8)}@test.voce`
  const password = "password-e2e-voce"
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { workspace_name: `Prova ${label}` },
  })
  if (error) throw error
  const { data: member, error: memberError } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", data.user.id)
    .single()
  if (memberError) throw memberError
  const workspaceId = member.workspace_id as string
  const research = options.research === false ? null : await createResearch(workspaceId, label)
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Accedi" }).click()
  await expect(page).toHaveURL(/\/research$/)
  return { workspaceId, researchId: research?.researchId ?? "", formSlug: research?.formSlug ?? "" }
}

// A Research written as the server would: question "Domanda di {label}?", form on, default form question.
export async function createResearch(workspaceId: string, label: string) {
  const { data, error } = await admin
    .from("research")
    .insert({
      workspace_id: workspaceId,
      question: `Domanda di ${label}?`,
      form_slug: `e2e-${label}-${crypto.randomUUID().slice(0, 8)}`,
    })
    .select("id, form_slug")
    .single()
  if (error) throw error
  return { workspaceId, researchId: data.id as string, formSlug: data.form_slug as string }
}

export const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export async function insertFeedback(
  research: { workspaceId: string; researchId: string },
  texts: string[],
  firstDaysAgo = 0
) {
  const { error } = await admin.from("feedback").insert(
    texts.map((text, i) => ({
      workspace_id: research.workspaceId,
      research_id: research.researchId,
      text,
      channel: "Supporto",
      received_at: daysAgo(firstDaysAgo + i),
    }))
  )
  if (error) throw error
}
