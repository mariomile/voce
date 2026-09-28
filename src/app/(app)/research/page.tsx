import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { ResearchDeletedNotice } from "@/components/research-deleted"
import { ResearchForm } from "@/components/research-form"
import { ResearchRow } from "@/components/research-row"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentWorkspace, listResearch } from "@/lib/data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("research.metadata")
  return { title: t("title") }
}

// The list of the workspace's Research, most recent activity first, or the first run when there is none:
// the question field is already on the page, because the first analysis should come within a day of the
// signup. After a deletion both say "Research eliminata.".
export default async function ResearchPage() {
  const workspace = await getCurrentWorkspace()
  const [research, t] = await Promise.all([listResearch(workspace.id), getTranslations("research")])

  if (research.length === 0)
    return (
      <Page>
        <div className="py-6">
          <ResearchDeletedNotice />
          <h1 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">
            {t("firstRun.title")}
          </h1>
          <p className="mb-10 max-w-[58ch] text-lg leading-relaxed text-ink-muted">{t("firstRun.lede")}</p>
          <ResearchForm />
        </div>
      </Page>
    )

  return (
    <Page>
      <PageHeader className="border-b-2 border-ink pb-6">
        <div>
          <PageTitle id="research-list-title" tabIndex={-1} className="outline-none">
            {t("list.title")}
          </PageTitle>
          <PageLede>{t("list.lede")}</PageLede>
        </div>
        <Link href="/research/new" className={buttonVariants()}>
          {t("list.newResearch")}
        </Link>
      </PageHeader>
      <ResearchDeletedNotice focusId="research-list-title" />
      {research.map((r) => (
        <ResearchRow key={r.id} research={r} />
      ))}
    </Page>
  )
}
