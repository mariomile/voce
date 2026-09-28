"use client"

import { useTranslations } from "next-intl"
import { signUp } from "@/app/(auth)/actions"
import { AuthFieldError, AuthForm, fieldProps } from "@/components/auth-form"
import { PasswordInput } from "@/components/password-input"
import { Field, FieldHint, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// The password rule matches Supabase Auth (password_min_length 8) and the server check in signUp.
export function SignupForm() {
  const t = useTranslations("auth")
  return (
    <AuthForm action={signUp} submitLabel={t("signup.submit")}>
      {(state) => (
        <>
          <Field>
            <FieldLabel htmlFor="workspace">{t("signup.workspaceLabel")}</FieldLabel>
            <Input
              {...fieldProps(state, "workspace", "workspace-hint")}
              autoComplete="organization"
              maxLength={60}
              required
            />
            <FieldHint id="workspace-hint">{t("signup.workspaceHint")}</FieldHint>
            <AuthFieldError state={state} name="workspace" />
          </Field>
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
            <PasswordInput
              {...fieldProps(state, "password", "password-hint")}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <FieldHint id="password-hint">{t("signup.passwordHint")}</FieldHint>
            <AuthFieldError state={state} name="password" />
          </Field>
        </>
      )}
    </AuthForm>
  )
}
