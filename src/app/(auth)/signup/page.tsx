import type { Metadata } from "next"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"
import { GoogleSignIn } from "@/components/google-sign-in"
import { PageLede, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { SignupForm } from "@/components/signup-form"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signup")
  return { title: t("metaTitle") }
}

export default function SignupPage() {
  const t = useTranslations("auth.signup")
  return (
    <>
      <PageTitle>{t("title")}</PageTitle>
      <PageLede className="mb-8">
        {t("lede")}
      </PageLede>
      <GoogleSignIn />
      <SignupForm />
      <p className="mt-8 text-base text-ink-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className={buttonVariants({ variant: "link" })}>
          {t("loginLink")}
        </Link>
      </p>
    </>
  )
}
