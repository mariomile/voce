import { cn } from "cn"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { ReportControls } from "@/components/report-controls"
import { ReportDocument } from "@/components/report-document"
import { buttonVariants } from "@/components/ui/button"
import { getLatestReport, getReportSource, getResearch, getUsage } from "@/lib/data"
import { formatDate, formatMonth } from "@/lib/format"
import { reportMarkdown, reportT } from "@/lib/report-format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("research.tabs")
  return { title: t("report") }
}

// The report action runs from this page: the model stops at 120 seconds.
export const maxDuration = 180

// The Report tab: the latest report of the Research, with Copia, Stampa and Rigenera, and a note when the
// Research changed after it. Without one, "Genera il report"; without a synthesis with themes, the way to the
// Sintesi. The report reads in the language it was written in; the page around it in the current one.
export default async function ReportPage({ params }: PageProps<"/research/[id]/report">) {
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const [report, usage, locale, t, tCommon] = await Promise.all([
    getLatestReport(research),
    getUsage(research.workspaceId),
    getLocale(),
    getTranslations("report.page"),
    getTranslations("common"),
  ])
  const path = `/research/${research.id}`
  const source = report ? null : await getReportSource(research)

  // No synthesis yet, or one whose themes were all discarded or emptied: the report has nothing to start from.
  const empty = source ? "noThemes" : "noSynthesis"
  if (!report && (!source || source.themes.length === 0))
    return (
      <div className="py-6">
        <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">{t(`${empty}.title`)}</h2>
        <p className="mb-8 max-w-[58ch] text-lg leading-relaxed text-ink-muted">{t(`${empty}.text`)}</p>
        <Link href={path} className={buttonVariants()}>
          {t("noSynthesis.action")}
        </Link>
      </div>
    )

  const month = formatMonth(new Date(), locale)
  const controls = {
    researchId: research.id,
    note: t("cost", { limit: usage.analysesLimit, month }),
    limitMessage: tCommon(usage.plan === "pro" ? "analysisLimit.pro" : "analysisLimit.free", {
      limit: usage.analysesLimit,
      month,
    }),
    atLimit: usage.analysesThisMonth >= usage.analysesLimit,
  }

  const tDocument = report && reportT(await getTranslations({ locale: report.locale, namespace: "report.document" }))
  const stale = report !== null && (report.newerSynthesisAt !== null || report.newFeedback > 0)
  // One tree with or without a report, the controls in the same place: the button keeps its focus, and its
  // announcement, when the first report lands and the page refreshes.
  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "mb-12 flex flex-col gap-6 print:hidden",
          report ? "sm:flex-row sm:items-start sm:justify-between sm:gap-10" : "gap-8",
          stale && "rounded-lg bg-highlight-soft p-6 [&_p]:text-on-highlight"
        )}
      >
        {!report ? (
          <div>
            <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">{t("empty.title")}</h2>
            <p className="mb-3 max-w-[62ch] text-lg leading-relaxed text-ink-muted">{t("empty.text")}</p>
            <p className="max-w-[62ch] text-base text-ink">
              {t("empty.fromSynthesis", {
                date: formatDate(source!.synthesis.createdAt, locale),
                count: source!.synthesis.feedbackRead,
                themes: source!.themes.length,
                hypotheses: source!.hypotheses.length,
              })}
            </p>
          </div>
        ) : (
          <div className="max-w-[60ch]">
            {stale && <p className="mb-1 text-xl leading-snug font-bold">{t("stale.title")}</p>}
            {report.newerSynthesisAt ? (
              <p className="text-base">{t("stale.newerSynthesis", { date: formatDate(report.newerSynthesisAt, locale) })}</p>
            ) : report.newFeedback > 0 ? (
              <p className="text-base">
                {t("stale.newFeedback", { count: report.newFeedback })} {t("stale.analyzeFirst")}{" "}
                <Link href={path} className={buttonVariants({ variant: "link" })}>
                  {t("noSynthesis.action")}
                </Link>
              </p>
            ) : null}
            <p className={cn("text-base text-ink-muted", stale && "mt-2")}>
              {t("generatedOn", {
                date: formatDate(report.createdAt, locale),
                synthesis: formatDate(report.content.synthesis.createdAt, locale),
              })}
              {report.locale !== locale && ` ${t("otherLanguage")}`}
            </p>
          </div>
        )}
        <ReportControls
          {...controls}
          markdown={report && tDocument ? reportMarkdown(report, tDocument) : undefined}
          primary={!report || report.newerSynthesisAt !== null}
        />
      </div>
      {report && tDocument && <ReportDocument report={report} t={tDocument} />}
    </div>
  )
}
