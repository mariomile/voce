import { existsSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { expect, type Page } from "@playwright/test"

// Helpers for the end-to-end tests: the Mailpit inbox, and users and rows made with the secret key
// of the local Supabase (the same .env.local the app reads).

if (existsSync(".env.local")) process.loadEnvFile(".env.local")

const MAILPIT = "http://127.0.0.1:54324"

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

export const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// A confirmed user with their own workspace, signed in through the login page.
export async function signedInUser(page: Page, label: string) {
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
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Accedi" }).click()
  await expect(page).toHaveURL(/\/themes$/)
  return { workspaceId: member.workspace_id as string }
}

export const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export async function insertFeedback(workspaceId: string, texts: string[], firstDaysAgo = 0) {
  const { error } = await admin.from("feedback").insert(
    texts.map((text, i) => ({ workspace_id: workspaceId, text, channel: "Supporto", received_at: daysAgo(firstDaysAgo + i) }))
  )
  if (error) throw error
}
