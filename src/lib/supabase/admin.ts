import "server-only"

import { createHmac } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// The secret key bypasses RLS, so it does exactly one thing: send a public form submission.
// Only the server may do that, with the visitor IP it sees, so the rate limits cannot be skipped.
export async function sendPublicFeedback(input: {
  slug: string
  text: string
  email: string
  clientIp: string
}): Promise<"ok" | "invalid" | "unavailable" | "rate_limited"> {
  const secretKey = process.env.SUPABASE_SECRET_KEY!
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data, error } = await supabase.rpc("submit_public_feedback", {
    slug: input.slug,
    feedback_text: input.text,
    email: input.email,
    // Keyed hash: the database never sees the IP, and cannot turn the hash back into one.
    client_ip: createHmac("sha256", secretKey).update(input.clientIp).digest("hex"),
  })
  if (error) throw error
  if (data === "ok" || data === "invalid" || data === "unavailable" || data === "rate_limited") return data
  throw new Error(`Unexpected public form result: ${data}`)
}
