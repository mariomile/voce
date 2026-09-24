import "server-only"

// Google sign-in shows up only once it is turned on in Supabase Auth, so the button
// never leads to a provider that is not configured.
export async function isGoogleEnabled() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    })
    if (!response.ok) return false
    const settings: { external?: { google?: boolean } } = await response.json()
    return settings.external?.google === true
  } catch {
    return false
  }
}
