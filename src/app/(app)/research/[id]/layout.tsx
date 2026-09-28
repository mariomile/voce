import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { AppTabs } from "@/components/app-tabs"
import { Page, PageLede } from "@/components/page"
import { ResearchTitle } from "@/components/research-title"
import { getResearch, getResearchStats } from "@/lib/data"
import { formatDate } from "@/lib/format"

export async function generateMetadata({ params }: LayoutProps<"/research/[id]">): Promise<Metadata> {
  const research = await getResearch((await params).id)
  return { title: research?.question ?? "Voce" }
}

// The header every tab of a Research shares: the way back, the question, its numbers, the tabs.
// A Research the user cannot read (another workspace's, deleted, a wrong id) is the same not-found page.
export default async function ResearchLayout({ children, params }: LayoutProps<"/research/[id]">) {
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const [stats, t, locale] = await Promise.all([getResearchStats(research), getTranslations("research"), getLocale()])
  const path = `/research/${research.id}`
  return (
    <Page>
      <header className="mb-8">
        <Link href="/research" className="mb-4 inline-block text-md text-ink-muted hover:underline">
          <span aria-hidden="true">← </span>
          {t("header.back")}
        </Link>
        <ResearchTitle>{research.question}</ResearchTitle>
        <PageLede>
          {stats.feedbackCount > 0
            ? t("header.ledeCount", {
                count: stats.feedbackCount,
                channels: stats.channelCount,
                start: formatDate(stats.firstReceivedAt!, locale),
                end: formatDate(stats.lastReceivedAt!, locale),
              })
            : research.formEnabled
              ? t("header.ledeEmpty")
              : null}
        </PageLede>
      </header>
      <AppTabs
        label={t("tabs.label")}
        className="mb-10 flex h-12 gap-6 border-b border-line"
        tabs={[
          // The Sintesi holds the themes: it stays current on the page of a theme.
          { href: path, label: t("tabs.synthesis"), exact: true, also: [`${path}/themes/`] },
          { href: `${path}/ask`, label: t("tabs.ask") },
          { href: `${path}/feedback`, label: t("tabs.feedback") },
          { href: `${path}/collect`, label: t("tabs.collect") },
        ]}
      />
      {children}
    </Page>
  )
}
