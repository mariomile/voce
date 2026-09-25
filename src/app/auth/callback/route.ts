import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { trackMilestone } from "@/lib/analytics"
import { workspaceOfUser } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Google sends the user back here with a code, exchanged for a session (PKCE).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Every Google sign-in asks: the event leaves only the first time, when the account is new.
      const userId = data.user.id
      trackMilestone(() => workspaceOfUser(userId), { event: "signed_up", properties: { method: "google" } })
      redirect("/themes")
    }
  }
  redirect("/login?error=link")
}
