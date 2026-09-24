import type { Metadata } from "next"
import Link from "next/link"
import { AuthForm } from "@/components/auth-form"
import { PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = { title: "Accedi a Voce" }

export default function LoginPage() {
  return (
    <>
      <PageTitle className="mb-8">Accedi a Voce</PageTitle>
      <AuthForm submitLabel="Accedi">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" autoComplete="current-password" required />
        </Field>
      </AuthForm>
      <p className="mt-8 text-base text-ink-muted">
        Non hai un account?{" "}
        <Link href="/signup" className={buttonVariants({ variant: "link" })}>
          Crea il tuo workspace
        </Link>
      </p>
    </>
  )
}
