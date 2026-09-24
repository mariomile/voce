"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

// UI only: submitting just opens the app. The Supabase step replaces this with real auth.
export function AuthForm({ submitLabel, children }: { submitLabel: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        router.push("/themes")
      }}
    >
      {children}
      <Button type="submit" size="lg" className="mt-3 w-full">
        {submitLabel}
      </Button>
    </form>
  )
}
