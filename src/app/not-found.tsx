import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"

// Every unknown address: a wrong link, a public form that no longer exists, a mistyped path.
export default async function NotFound() {
  const t = await getTranslations("common.notFound")
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-2 text-lg font-bold">
        <Logo />
        Voce
      </Link>
      <h1 className="mb-4 text-4xl leading-tight font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-10 max-w-[48ch] text-lg leading-relaxed text-ink-muted">{t("text")}</p>
      <Link href="/" className={`${buttonVariants()} self-start`}>
        {t("action")}
      </Link>
    </main>
  )
}
