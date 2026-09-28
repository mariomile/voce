import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { trackMilestone } from "@/lib/analytics"
import { workspaceOfUser } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Back from Google, or from the confirmation email sent with Supabase's default template
// (`flow=signup`): Supabase adds a code, exchanged for a session (PKCE).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const fromEmail = request.nextUrl.searchParams.get("flow") === "signup"
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Every Google sign-in asks: the event leaves only the first time, when the account is new.
      const userId = data.user.id
      trackMilestone(() => workspaceOfUser(userId), {
        event: "signed_up",
        properties: { method: fromEmail ? "email" : "google" },
      })
      redirect("/themes")
    }
    // The exchange needs the code verifier cookie of the browser that signed up. Opened elsewhere,
    // the link has still confirmed the email: Supabase gives a code only after confirming it.
    if (fromEmail) redirect("/login?confirmed=1")
  }
  redirect("/login?error=link")
}
