"use client"

import { useTranslations } from "next-intl"
import { signIn } from "@/app/(auth)/actions"
import { AuthFieldError, AuthForm, fieldProps } from "@/components/auth-form"
import { PasswordInput } from "@/components/password-input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const t = useTranslations("auth")
  return (
    <AuthForm action={signIn} submitLabel={t("login.submit")}>
      {(state) => (
        <>
          <Field>
            <FieldLabel htmlFor="email">{t("fields.email")}</FieldLabel>
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
            <FieldLabel htmlFor="password">{t("fields.password")}</FieldLabel>
            <PasswordInput {...fieldProps(state, "password")} autoComplete="current-password" maxLength={72} required />
            <AuthFieldError state={state} name="password" />
          </Field>
        </>
      )}
    </AuthForm>
  )
}
