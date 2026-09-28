import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { GoogleSignIn } from "@/components/google-sign-in"
import { LoginForm } from "@/components/login-form"
import { PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login")
  return { title: t("metaTitle") }
}

const LINK_ERRORS = ["link", "google"] as const

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, confirmed } = await searchParams
  const t = await getTranslations("auth.login")
  const linkError = LINK_ERRORS.find((e) => e === error)
  return (
    <>
      <PageTitle className="mb-8">{t("title")}</PageTitle>
      {confirmed === "1" && (
        <p role="status" className="mb-5 text-base">
          {t("confirmed")}
        </p>
      )}
      {linkError && (
        <FieldError role="alert" className="mb-5">
          {t(`linkError.${linkError}`)}
        </FieldError>
      )}
      <GoogleSignIn />
      <LoginForm />
      <p className="mt-8 text-base text-ink-muted">
        {t("noAccount")}{" "}
        <Link href="/signup" className={buttonVariants({ variant: "link" })}>
          {t("signupLink")}
        </Link>
      </p>
    </>
  )
}
