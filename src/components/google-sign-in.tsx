import { connection } from "next/server"
import { signInWithGoogle } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { isGoogleEnabled } from "@/lib/auth"

// Renders nothing until Google is turned on in Supabase Auth.
export async function GoogleSignIn() {
  // Read at request time, not at build time.
  await connection()
  if (!(await isGoogleEnabled())) return null
  return (
    <form action={signInWithGoogle} className="mb-8 flex flex-col gap-5">
      <Button type="submit" variant="secondary" size="lg" className="w-full">
        Continua con Google
      </Button>
      <p className="text-center text-sm text-ink-subtle">oppure con email e password</p>
    </form>
  )
}
