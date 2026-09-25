import type { Metadata } from "next"
import Link from "next/link"
import { signUp } from "@/app/(auth)/actions"
import { AuthForm } from "@/components/auth-form"
import { GoogleSignIn } from "@/components/google-sign-in"
import { PageLede, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { Field, FieldHint, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = { title: "Crea il tuo workspace su Voce" }

export default function SignupPage() {
  return (
    <>
      <PageTitle>Crea il tuo workspace</PageTitle>
      <PageLede className="mb-8">
        Parti con il piano Free: 100 feedback e 3 analisi al mese. Non serve una carta.
      </PageLede>
      <GoogleSignIn />
      <AuthForm action={signUp} submitLabel="Crea il workspace">
        <Field>
          <FieldLabel htmlFor="workspace">Nome del prodotto</FieldLabel>
          <Input id="workspace" name="workspace" autoComplete="organization" maxLength={60} required />
          <FieldHint>Lo vedono i clienti nel modulo pubblico.</FieldHint>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <FieldHint>Almeno 8 caratteri.</FieldHint>
        </Field>
      </AuthForm>
      <p className="mt-8 text-base text-ink-muted">
        Hai già un account?{" "}
        <Link href="/login" className={buttonVariants({ variant: "link" })}>
          Accedi
        </Link>
      </p>
    </>
  )
}
