import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { nextMonthName } from "@/components/ask-copy"
import { AskForm } from "@/components/ask-form"
import { PageLede } from "@/components/page"
import { buttonVariants } from "@/components/ui/button"
import { getAnalysisPerimeter, getResearch, getResearchStats, getUsage } from "@/lib/data"
import { formatMonth } from "@/lib/format"

// The question action runs from this page: the model stops at 60 seconds.
export const maxDuration = 90

// The Chiedi tab: questions about the feedback of this Research only, with the analysis perimeter.
export default async function AskPage({ params }: PageProps<"/research/[id]/ask">) {
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const [t, locale, stats, perimeter, usage] = await Promise.all([
    getTranslations("ask"),
    getLocale(),
    getResearchStats(research),
    getAnalysisPerimeter(research),
    getUsage(research.workspaceId),
  ])
  const now = new Date()

  // In place of the field: a question without feedback would spend the quota for nothing.
  if (stats.feedbackCount === 0)
    return (
      <div className="py-6">
        <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">
          {t("nothingToAsk.titleEmpty")}
        </h2>
        <p className="mb-8 max-w-[58ch] text-lg leading-relaxed text-ink-muted">{t("nothingToAsk.bodyEmpty")}</p>
        <Link href={`/research/${research.id}/collect`} className={buttonVariants()}>
          {t("page.addFeedback")}
        </Link>
      </div>
    )

  return (
    <>
      <PageLede className="mb-8">{t("page.lede")}</PageLede>
      <AskForm
        researchId={research.id}
        feedbackConsidered={perimeter}
        feedbackTotal={stats.feedbackCount}
        plan={usage.plan}
        usage={{ used: usage.questionsThisMonth, quota: usage.questionsLimit }}
        month={formatMonth(now, locale)}
        nextMonth={nextMonthName(now, locale)}
      />
    </>
  )
}
