import type { Metadata } from "next"
import Link from "next/link"
import { GoogleSignIn } from "@/components/google-sign-in"
import { LoginForm } from "@/components/login-form"
import { PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

export const metadata: Metadata = { title: "Accedi a Voce" }

const LINK_ERRORS: Record<string, string> = {
  link: "Il link non è valido o è scaduto. Accedi, oppure registrati di nuovo.",
  google: "L'accesso con Google non è riuscito. Riprova.",
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, confirmed } = await searchParams
  const linkError = typeof error === "string" ? LINK_ERRORS[error] : undefined
  return (
    <>
      <PageTitle className="mb-8">Accedi a Voce</PageTitle>
      {confirmed === "1" && (
        <p role="status" className="mb-5 text-base">
          Email confermata. Accedi per entrare nel tuo workspace.
        </p>
      )}
      {linkError && (
        <FieldError role="alert" className="mb-5">
          {linkError}
        </FieldError>
      )}
      <GoogleSignIn />
      <LoginForm />
      <p className="mt-8 text-base text-ink-muted">
        Non hai un account?{" "}
        <Link href="/signup" className={buttonVariants({ variant: "link" })}>
          Crea il tuo workspace
        </Link>
      </p>
    </>
  )
}
