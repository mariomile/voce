import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import Link from "next/link"
import { nextMonthName } from "@/components/ask-copy"
import { AskForm } from "@/components/ask-form"
import { Page, PageHeader, PageLede, PageTitle } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { ANALYSIS_MAX_FEEDBACK } from "@/lib/analysis"
import { getCurrentWorkspace, getQuestionWindow, getUsage } from "@/lib/data"
import { formatMonth } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ask.meta")
  return { title: t("title") }
}

// The question action runs from this page: the model stops at 60 seconds.
export const maxDuration = 90

export default async function AskPage() {
  const t = await getTranslations("ask")
  const locale = await getLocale()
  const workspace = await getCurrentWorkspace()
  const [feedbackWindow, usage] = await Promise.all([getQuestionWindow(workspace.id), getUsage(workspace.id)])
  const now = new Date()

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>{t("page.title")}</PageTitle>
          <PageLede>{t("page.lede")}</PageLede>
        </div>
      </PageHeader>
      {feedbackWindow.recent === 0 ? (
        <NothingToAsk t={t} olderCount={feedbackWindow.total} />
      ) : (
        <AskForm
          feedbackConsidered={Math.min(feedbackWindow.recent, ANALYSIS_MAX_FEEDBACK)}
          feedbackInWindow={feedbackWindow.recent}
          plan={usage.plan}
          usage={{ used: usage.questionsThisMonth, quota: usage.questionsLimit }}
          month={formatMonth(now, locale)}
          nextMonth={nextMonthName(now, locale)}
        />
      )}
    </Page>
  )
}

// In place of the field: a question without feedback would spend the quota for nothing.
function NothingToAsk({ t, olderCount }: { t: Awaited<ReturnType<typeof getTranslations<"ask">>>; olderCount: number }) {
  return (
    <div className="py-6">
      <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">
        {olderCount === 0 ? t("nothingToAsk.titleEmpty") : t("nothingToAsk.titleOld")}
      </h2>
      <p className="mb-8 max-w-[58ch] text-lg leading-relaxed text-ink-muted">
        {olderCount === 0 ? t("nothingToAsk.bodyEmpty") : t("nothingToAsk.bodyOld", { count: olderCount })}
      </p>
      <Link href="/research" className={buttonVariants()}>
        {t("page.addFeedback")}
      </Link>
    </div>
  )
}
