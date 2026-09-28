"use client"

import { signIn } from "@/app/(auth)/actions"
import { AuthFieldError, AuthForm, fieldProps } from "@/components/auth-form"
import { PasswordInput } from "@/components/password-input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  return (
    <AuthForm action={signIn} submitLabel="Accedi">
      {(state) => (
        <>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              {...fieldProps(state, "email")}
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={254}
              required
            />
            <AuthFieldError state={state} name="email" />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput {...fieldProps(state, "password")} autoComplete="current-password" maxLength={72} required />
            <AuthFieldError state={state} name="password" />
          </Field>
        </>
      )}
    </AuthForm>
  )
}
