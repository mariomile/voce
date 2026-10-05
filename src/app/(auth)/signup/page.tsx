import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { getTranslations } from "next-intl/server"
import { AccessContact } from "@/components/access-contact"
import { GoogleSignIn } from "@/components/google-sign-in"
import { PageLede, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { SignupForm } from "@/components/signup-form"
import { areSignupsOpen } from "@/lib/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signup")
  return { title: t("metaTitle") }
}

export default async function SignupPage() {
  // Read at request time, not at build time.
  await connection()
  const t = await getTranslations("auth.signup")
  const open = await areSignupsOpen()
  return (
    <>
      <PageTitle>{t(open ? "title" : "closedTitle")}</PageTitle>
      {open ? (
        <PageLede className="mb-8">{t("lede")}</PageLede>
      ) : (
        <AccessContact withClosed={false} className="mb-8 text-lg text-ink-muted" />
      )}
      {open && (
        <>
          <GoogleSignIn />
          <SignupForm />
        </>
      )}
      <p className="mt-8 text-base text-ink-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className={buttonVariants({ variant: "link" })}>
          {t("loginLink")}
        </Link>
      </p>
    </>
  )
}
