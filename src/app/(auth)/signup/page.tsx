import type { Metadata } from "next"
import Link from "next/link"
import { GoogleSignIn } from "@/components/google-sign-in"
import { PageLede, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { SignupForm } from "@/components/signup-form"

export const metadata: Metadata = { title: "Crea il tuo workspace su Voce" }

export default function SignupPage() {
  return (
    <>
      <PageTitle>Crea il tuo workspace</PageTitle>
      <PageLede className="mb-8">
        Parti con il piano Free: 100 feedback e 3 analisi al mese. Non serve una carta.
      </PageLede>
      <GoogleSignIn />
      <SignupForm />
      <p className="mt-8 text-base text-ink-muted">
        Hai già un account?{" "}
        <Link href="/login" className={buttonVariants({ variant: "link" })}>
          Accedi
        </Link>
      </p>
    </>
  )
}
