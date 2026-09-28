"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"
import type { AuthField, AuthState } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

// The id, name and error links of a field: the error of that field is read after its hint.
export function fieldProps(state: AuthState, name: AuthField, hintId?: string) {
  const invalid = state.field === name
  const describedBy = [hintId, invalid ? `${name}-error` : undefined].filter(Boolean).join(" ")
  return {
    id: name,
    name,
    ...(invalid && { "aria-invalid": true as const }),
    ...(describedBy && { "aria-describedby": describedBy }),
  }
}

// The error under the field it is about.
export function AuthFieldError({ state, name }: { state: AuthState; name: AuthField }) {
  if (state.field !== name) return null
  return <FieldError id={`${name}-error`}>{state.error}</FieldError>
}

// Submits through a server action. Not a form action, so the fields keep what was typed on error.
export function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (formData: FormData) => Promise<AuthState>
  submitLabel: string
  children: (state: AuthState) => React.ReactNode
}) {
  const t = useTranslations("auth.signup")
  const [state, setState] = useState<AuthState>({})
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // The field with the error takes the focus, so the error is read and the fix starts there.
  useEffect(() => {
    if (!state.field) return
    const field = formRef.current?.elements.namedItem(state.field)
    if (field instanceof HTMLInputElement) field.focus()
  }, [state])

  if (state.sentTo)
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="text-lg font-semibold">{t("checkEmail")}</p>
        <p className="text-base text-ink-muted">
          {t.rich("sentTo", { email: state.sentTo, b: (chunks) => <b className="text-ink">{chunks}</b> })}
        </p>
      </div>
    )

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(async () => setState(await action(formData)))
      }}
    >
      {children(state)}
      {state.error && !state.field && <FieldError role="alert">{state.error}</FieldError>}
      {/* Disabled while waiting: a double click or a second Enter sends one request. */}
      <Button type="submit" size="lg" className="mt-3 w-full" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
