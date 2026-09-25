import type { EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { trackMilestone } from "@/lib/analytics"
import { workspaceOfUser } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// The confirmation email links here with a token hash. Verifying it signs the user in.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null
  if (tokenHash && type) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      // The signup confirmation: the account starts here.
      const userId = data.user?.id
      if (userId && (type === "email" || type === "signup"))
        trackMilestone(() => workspaceOfUser(userId), { event: "signed_up", properties: { method: "email" } })
      redirect("/themes")
    }
  }
  redirect("/login?error=link")
}
