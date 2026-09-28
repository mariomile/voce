import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Page } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"

// The same page for a Research of another workspace, a deleted one and a wrong id: saying which
// would tell that someone else's Research exists.
export default async function ResearchNotFound() {
  const t = await getTranslations("research.notFound")
  return (
    <Page>
      <div className="py-6">
        <h1 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">{t("title")}</h1>
        <p className="mb-10 max-w-[58ch] text-lg leading-relaxed text-ink-muted">{t("text")}</p>
        <Link href="/research" className={buttonVariants()}>
          {t("action")}
        </Link>
      </div>
    </Page>
  )
}
