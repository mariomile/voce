import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Test helpers against the local Supabase (`supabase start`, then `supabase db reset` for the seed).
// The secret key only creates and deletes test users: every check runs through the public API.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY
if (!url || !publishableKey || !secretKey)
  throw new Error("Tests need local Supabase keys in .env.local: see README, 'Supabase in locale'.")

const options = { auth: { persistSession: false, autoRefreshToken: false } }

export type Client = SupabaseClient<Database>

export const admin: Client = createClient<Database>(url, secretKey, options)

export function anon(): Client {
  return createClient<Database>(url!, publishableKey!, options)
}

export const SEED_PASSWORD = "password-voce"

export async function signIn(email: string, password = SEED_PASSWORD): Promise<Client> {
  const client = anon()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

export type TestUser = { client: Client; userId: string; workspaceId: string; formSlug: string }

// A fresh confirmed user. The signup trigger gives them a workspace, like a real signup.
export async function createTestUser(label: string): Promise<TestUser> {
  const email = `${label}-${crypto.randomUUID().slice(0, 8)}@test.voce`
  const password = crypto.randomUUID()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { workspace_name: `Prova ${label}` },
  })
  if (error) throw error
  const { data: member } = await admin
    .from("workspace_members")
    .select("workspace_id, workspaces (form_slug)")
    .eq("user_id", data.user.id)
    .single()
  return {
    client: await signIn(email, password),
    userId: data.user.id,
    workspaceId: member!.workspace_id,
    formSlug: member!.workspaces.form_slug,
  }
}

export async function deleteTestUsers(users: (TestUser | undefined)[]) {
  for (const user of users) {
    if (!user) continue
    await admin.from("workspaces").delete().eq("id", user.workspaceId)
    await admin.auth.admin.deleteUser(user.userId)
  }
}
