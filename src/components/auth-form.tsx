"use client"

import { useState, useTransition } from "react"
import type { AuthState } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

// Submits through a server action. Not a form action, so the fields keep what was typed on error.
export function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (formData: FormData) => Promise<AuthState>
  submitLabel: string
  children: React.ReactNode
}) {
  const [state, setState] = useState<AuthState>({})
  const [pending, startTransition] = useTransition()

  if (state.sentTo)
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="text-lg font-semibold">Controlla la tua email</p>
        <p className="text-base text-ink-muted">
          Ti abbiamo mandato un link a <b className="text-ink">{state.sentTo}</b>. Aprilo per confermare
          l&apos;indirizzo ed entrare nel tuo workspace.
        </p>
      </div>
    )

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => setState(await action(formData)))
      }}
    >
      {children}
      {state.error && <FieldError role="alert">{state.error}</FieldError>}
      <Button type="submit" size="lg" className="mt-3 w-full" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
