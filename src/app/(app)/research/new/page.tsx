import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { ResearchForm } from "@/components/research-form"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("research.list")
  return { title: t("newResearch") }
}

export default async function NewResearchPage() {
  const t = await getTranslations("research.list")
  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>{t("newResearch")}</PageTitle>
          <PageLede>{t("lede")}</PageLede>
        </div>
      </PageHeader>
      <ResearchForm cancelHref="/research" />
    </Page>
  )
}
