import "server-only"

type AuthSettings = { disable_signup?: boolean; external?: { google?: boolean } }

// The public settings of Supabase Auth: null when Supabase does not answer.
async function authSettings(): Promise<AuthSettings | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// Google sign-in shows up only once it is turned on in Supabase Auth, so the button
// never leads to a provider that is not configured.
export async function isGoogleEnabled() {
  return (await authSettings())?.external?.google === true
}

// Sign-ups are paused by turning off "Allow new users to sign up" in Supabase Auth: that switch
// also blocks direct calls to the Auth API. The sign-up page follows it. If Supabase does not
// answer, the form shows and signUp reports the error.
export async function areSignupsOpen() {
  return (await authSettings())?.disable_signup !== true
}
