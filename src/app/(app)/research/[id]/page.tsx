import { cn } from "cn"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { AnalyzeButton } from "@/components/analyze-button"
import { CollectionPaths } from "@/components/collection-paths"
import { HypothesisList } from "@/components/hypothesis-list"
import { LimitWarning } from "@/components/limit-warning"
import { PageLede, PageMore, SectionHeading, StepNumber } from "@/components/page"
import { Quote } from "@/components/quote"
import { StatusMenu } from "@/components/status-menu"
import { SynthesisOutcome } from "@/components/synthesis-outcome"
import { ThemeRow } from "@/components/theme-row"
import { buttonVariants } from "@/components/ui/button"
import { ChipCount, chipVariants, FilterBar, FilterBarSep } from "@/components/ui/chip"
import type { Locale } from "@/i18n/locale"
import {
  countFeedbackAfter,
  getAnalysisPerimeter,
  getDashboard,
  getResearch,
  getResearchStats,
  getUsage,
  listHypotheses,
  type StatusFilter,
  type Usage,
} from "@/lib/data"
import { formatDate, formatMonth, monthOf } from "@/lib/format"
import { getOrigin } from "@/lib/origin"
import type { ThemeKind } from "@/lib/types"

const KINDS: ThemeKind[] = ["problem", "opportunity", "praise"]
const STATUSES: StatusFilter[] = ["open", "all", "to_review", "roadmap", "done", "discarded"]
const VISIBLE_THEMES = 5
const FULL_THEMES = 3
// Below this the themes say little: the button says so, without blocking.
const FEW_FEEDBACK = 5

// The analysis action runs from this page and can take a few minutes.
export const maxDuration = 300

// The Sintesi tab: the hypotheses of the PM; without feedback, the ways to collect them; with feedback and no analysis, the first
// analysis; then the themes of the Research's last analysis and what changed since the one before.
export default async function SynthesisPage({ params, searchParams }: PageProps<"/research/[id]">) {
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch((await params).id)
  if (!research) notFound()
  const [stats, hypotheses] = await Promise.all([getResearchStats(research), listHypotheses(research)])
  // Hypotheses can be written before any feedback: then the ways to collect come first. The Free limit
  // counts every Research: in a full workspace a new one says so before offering ways that cannot add anything.
  if (stats.feedbackCount === 0) {
    const [usage, origin] = await Promise.all([getUsage(research.workspaceId), getOrigin()])
    const full = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
    // The loop in three numbered steps, in the order a PM follows: what they expect to find (optional),
    // the ways to collect, then what the analysis will give.
    const tEmpty = await getTranslations("themes.page.emptyNoFeedback")
    return (
      <>
        {full && <LimitWarning usage={usage} />}
        <div className="mb-12">
          <h2 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">{tEmpty("heading")}</h2>
          <p className="max-w-[58ch] text-lg leading-relaxed text-ink-muted">{tEmpty("lede")}</p>
        </div>
        <HypothesisList researchId={research.id} hypotheses={hypotheses} step={1} />
        <CollectionPaths research={research} origin={origin} />
        <section aria-labelledby="analyze-title">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-ink pb-4">
            <SectionHeading id="analyze-title">
              <StepNumber step={3} />
              {tEmpty("analyzeTitle")}
            </SectionHeading>
          </div>
          <p className="max-w-[64ch] py-5 text-base text-ink-muted">{tEmpty("analyzeText")}</p>
        </section>
      </>
    )
  }

  const query = await searchParams
  const kind = KINDS.find((k) => k === query.type)
  const status = STATUSES.find((s) => s === query.status) ?? "open"
  const showAll = query.all === "1"
  const [dashboard, usage, perimeter, locale, t, tSynthesis, tCommon, tKindPlural] = await Promise.all([
    getDashboard(research, { kind, status }),
    getUsage(research.workspaceId),
    getAnalysisPerimeter(research),
    getLocale(),
    getTranslations("themes"),
    getTranslations("research.synthesis"),
    getTranslations("common"),
    getTranslations("common.kindPlural"),
  ])

  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
  const now = new Date()
  const [year, monthNumber] = monthOf(now).split("-").map(Number)
  const quota = {
    remaining: Math.max(0, usage.analysesLimit - usage.analysesThisMonth),
    limit: usage.analysesLimit,
    month: formatMonth(now, locale),
    // The middle of next month on the Italian calendar: its name, for S4.
    nextMonth: formatMonth(new Date(Date.UTC(year, monthNumber, 15)), locale),
  }
  const notes = stats.feedbackCount < FEW_FEEDBACK ? [tSynthesis("analyze.lowFeedbackNote")] : []
  const { analysis } = dashboard
  const limitNote = analysisLimitNote(usage, tCommon, locale)
  const verdictOnly = {
    feedbackSinceThemes: analysis ? await countFeedbackAfter(research, analysis.createdAt) : null,
    note: tSynthesis("analyze.cost.one", { limit: quota.limit, month: quota.month }),
    limitNote,
  }
  const since = verdictOnly.feedbackSinceThemes
  const invite = !analysis
    ? {
        title: t("page.emptyNoAnalysis.readyTitle"),
        text: `${localeList(
          dashboard.channels.map((c) => t("page.emptyNoAnalysis.channelLine", { count: c.count, name: c.name })),
          locale
        )}.`,
      }
    : since
      ? {
          title: tSynthesis("newSince.title", { count: since }),
          text: tSynthesis("newSince.text", { date: formatDate(analysis.createdAt, locale) }),
        }
      : null
  const path = `/research/${research.id}`
  const visible = showAll ? dashboard.themes : dashboard.themes.slice(0, VISIBLE_THEMES)
  const hidden = dashboard.themes.slice(visible.length)
  const href = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = {
      type: kind,
      status: status === "open" ? undefined : status,
      all: showAll ? "1" : undefined,
      ...next,
    }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    return `${path}${params.size ? `?${params}` : ""}`
  }

  // One tree for both states, with the button in the same place: when the first analysis lands, the
  // page refreshes and the button keeps its focus and announces the result. The button comes before the
  // hypotheses, as in the design: its click starts their verdict too.
  return (
    <SynthesisOutcome>
      {limitReached && <LimitWarning usage={usage} />}
      {/* The state of the analysis and its button, in one band: soft yellow when there is something to read
          (the first analysis, or feedback arrived after the last one). The button keeps its place in the tree
          in every state, so it keeps the focus when the analysis lands and the page refreshes. */}
      <div
        className={cn(
          "mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8",
          invite ? "rounded-lg bg-highlight-soft p-6 sm:justify-between [&_p]:text-on-highlight" : "sm:justify-end"
        )}
      >
        {invite && (
          <div>
            <div className="mb-1 text-xl leading-snug font-bold">{invite.title}</div>
            <p className="text-base">{invite.text}</p>
          </div>
        )}
        <AnalyzeButton
          researchId={research.id}
          count={perimeter}
          total={stats.feedbackCount}
          quota={quota}
          hypothesisCount={hypotheses.length}
          notes={notes}
          limitNote={limitNote}
          upToDate={
            analysis && verdictOnly.feedbackSinceThemes === 0
              ? tSynthesis("analyze.upToDate", { date: formatDate(analysis.createdAt, locale) })
              : undefined
          }
        />
      </div>
      <HypothesisList researchId={research.id} hypotheses={hypotheses} verdictOnly={verdictOnly} />
      <section aria-labelledby="synthesis-title">
        <div className="mb-6">
          <SectionHeading id="synthesis-title" className="mb-2">
            {analysis
              ? tSynthesis("themesTitle")
              : t("page.emptyNoAnalysis.title", { count: dashboard.feedbackCount })}
          </SectionHeading>
          <PageLede>
            {analysis
              ? tSynthesis.rich("lede", {
                  count: analysis.feedbackCount,
                  start: formatDate(analysis.periodStart, locale),
                  end: formatDate(analysis.createdAt, locale),
                  themes: dashboard.analysisThemeCount,
                  b: (chunks) => <b>{chunks}</b>,
                })
              : t("page.emptyNoAnalysis.lede")}
          </PageLede>
          {dashboard.changes && (
            <p className="mt-1 text-base text-ink-muted">
              {tSynthesis("changes.line", {
                date: formatDate(dashboard.changes.since, locale),
                feedback: dashboard.changes.newFeedback,
                themes: dashboard.changes.newThemes,
              })}
            </p>
          )}
        </div>

        {!analysis && (
          <>
            <div className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
              {dashboard.recentFeedback.map((f) => (
                <Quote
                  key={f.id}
                  text={f.text}
                  size="sm"
                  maxLength={280}
                  cite={`${f.channel}, ${formatDate(f.receivedAt, locale)}`}
                  className="border-t border-line py-4"
                />
              ))}
            </div>
          </>
        )}

        {analysis && (
          <>
            <FilterBar>
              <Link href={href({ type: undefined })} aria-current={!kind} className={chipVariants()}>
                {t("page.filterAll")}
                <ChipCount>{dashboard.themeTotal}</ChipCount>
              </Link>
              {KINDS.map((k) => (
                <Link key={k} href={href({ type: k })} aria-current={kind === k} className={chipVariants()}>
                  {tKindPlural(k)}
                  <ChipCount>{dashboard.kindCounts[k] ?? 0}</ChipCount>
                </Link>
              ))}
              <FilterBarSep />
              <StatusMenu value={status} />
            </FilterBar>

            {visible.map((theme, i) => (
              <ThemeRow key={theme.id} theme={theme} compact={i >= FULL_THEMES} trendNote={i === 0} />
            ))}

            {dashboard.themes.length === 0 && (
              <PageMore>
                {t("page.noThemesFiltered")}{" "}
                <Link href={path} className={buttonVariants({ variant: "link" })}>
                  {t("page.showOpenThemes")}
                </Link>
              </PageMore>
            )}

            {hidden.length > 0 && (
              <PageMore>
                <Link href={href({ all: "1" })} className={buttonVariants({ variant: "link", className: "mr-2" })}>
                  {t("page.showMore", { count: hidden.length })}
                </Link>
                {t("page.withFeedback", {
                  list: localeList(hidden.map((theme) => String(theme.feedbackCount)), locale),
                })}
              </PageMore>
            )}
          </>
        )}
      </section>
    </SynthesisOutcome>
  )
}

// ["26", "19", "14"] → "26, 19 e 14" (it), "26, 19, and 14" (en)
function localeList(items: string[], locale: Locale) {
  return new Intl.ListFormat(locale === "it" ? "it-IT" : "en-US", { style: "long", type: "conjunction" }).format(items)
}

// undefined once analysesThisMonth < analysesLimit; otherwise the free/pro message of the month.
function analysisLimitNote(
  usage: Usage,
  tCommon: Awaited<ReturnType<typeof getTranslations<"common">>>,
  locale: Locale
) {
  if (usage.analysesThisMonth < usage.analysesLimit) return undefined
  return tCommon(usage.plan === "pro" ? "analysisLimit.pro" : "analysisLimit.free", {
    limit: usage.analysesLimit,
    month: formatMonth(new Date(), locale),
  })
}
