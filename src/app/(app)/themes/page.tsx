import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { AnalyzeButton } from "@/components/analyze-button"
import { CopyLinkButton } from "@/components/copy-link-button"
import { LimitWarning } from "@/components/limit-warning"
import { Page, PageHeader, PageLede, PageMore, PageTitle } from "@/components/page"
import { Quote } from "@/components/quote"
import { QrCode } from "@/components/qr-code"
import { StatusMenu } from "@/components/status-menu"
import { ThemeRow } from "@/components/theme-row"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardActions, CardBody, CardMeta, CardText, CardTitle } from "@/components/ui/card"
import { ChipCount, chipVariants, FilterBar, FilterBarSep } from "@/components/ui/chip"
import { getCurrentWorkspace, getDashboard, getUsage, type StatusFilter, type Usage } from "@/lib/data"
import type { Locale } from "@/i18n/locale"
import { getOrigin } from "@/lib/origin"
import { formatDate, formatMonth } from "@/lib/format"
import type { ThemeKind, Workspace } from "@/lib/types"

const KINDS: ThemeKind[] = ["problem", "opportunity", "praise"]
const STATUSES: StatusFilter[] = ["open", "all", "to_review", "roadmap", "done", "discarded"]
const VISIBLE_THEMES = 5
const FULL_THEMES = 3

// The analysis action runs from this page and can take a few minutes.
export const maxDuration = 300

export default async function ThemesPage({ searchParams }: PageProps<"/themes">) {
  const params = await searchParams
  const kind = KINDS.find((k) => k === params.type)
  const status = STATUSES.find((s) => s === params.status) ?? "open"
  const showAll = params.all === "1"

  const workspace = await getCurrentWorkspace()
  const [dashboard, usage, locale, t, tCommon, tKindPlural] = await Promise.all([
    getDashboard(workspace.id, { kind, status }),
    getUsage(workspace.id),
    getLocale(),
    getTranslations("themes"),
    getTranslations("common"),
    getTranslations("common.kindPlural"),
  ])

  if (dashboard.feedbackCount === 0)
    return <EmptyNoFeedback workspace={workspace} origin={await getOrigin()} t={t} />

  const limitReached = usage.feedbackLimit !== null && usage.feedbackCount >= usage.feedbackLimit
  const { analysis } = dashboard

  if (!analysis)
    return (
      <Page>
        {limitReached && <LimitWarning usage={usage} />}
        <EmptyNoAnalysis dashboard={dashboard} usage={usage} locale={locale} t={t} tCommon={tCommon} />
      </Page>
    )

  const visible = showAll ? dashboard.themes : dashboard.themes.slice(0, VISIBLE_THEMES)
  const hidden = dashboard.themes.slice(visible.length)
  const href = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams()
    const merged = {
      type: kind,
      status: status === "open" ? undefined : status,
      all: showAll ? "1" : undefined,
      ...next,
    }
    for (const [k, v] of Object.entries(merged)) if (v) query.set(k, v)
    return `/themes${query.size ? `?${query}` : ""}`
  }

  return (
    <Page>
      {limitReached && <LimitWarning usage={usage} />}
      <PageHeader>
        <div>
          <PageTitle>{t("page.title", { name: workspace.name })}</PageTitle>
          <PageLede>
            {t.rich("page.lede", {
              count: analysis.feedbackCount,
              start: formatDate(analysis.periodStart, locale),
              end: formatDate(analysis.createdAt, locale),
              themes: dashboard.analysisThemeCount,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </PageLede>
        </div>
        <AnalyzeButton label={t("page.newAnalysis")} limitNote={analysisLimitNote(usage, tCommon, locale)} />
      </PageHeader>

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
        <ThemeRow key={theme.id} theme={theme} compact={i >= FULL_THEMES} />
      ))}

      {dashboard.themes.length === 0 && (
        <PageMore>
          {t("page.noThemesFiltered")}{" "}
          <Link href="/themes" className={buttonVariants({ variant: "link" })}>
            {t("page.showOpenThemes")}
          </Link>
        </PageMore>
      )}

      {hidden.length > 0 && (
        <PageMore>
          <Link href={href({ all: "1" })} className={buttonVariants({ variant: "link", className: "mr-2" })}>
            {t("page.showMore", { count: hidden.length })}
          </Link>
          {t("page.withFeedback", { list: localeList(hidden.map((theme) => String(theme.feedbackCount)), locale) })}
        </PageMore>
      )}
    </Page>
  )
}

function EmptyNoFeedback({
  workspace,
  origin,
  t,
}: {
  workspace: Workspace
  origin: string
  t: Awaited<ReturnType<typeof getTranslations<"themes">>>
}) {
  const formPath = `/f/${workspace.formSlug}`
  return (
    <Page>
      <div className="py-6">
        <h1 className="mb-4 max-w-[24ch] font-serif text-5xl leading-snug font-normal tracking-snug">
          {t("page.emptyNoFeedback.heading")}
        </h1>
        <p className="mb-10 max-w-[58ch] text-lg leading-relaxed text-ink-muted">
          {t("page.emptyNoFeedback.lede")}
        </p>
        <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-5">
          <Card variant="highlight" layout="media">
            <CardBody>
              <CardTitle>{t("page.emptyNoFeedback.askTitle")}</CardTitle>
              <CardText>{t("page.emptyNoFeedback.askText")}</CardText>
              <CardMeta>
                <Link href={formPath} className="hover:underline">
                  {new URL(origin).host}
                  {formPath}
                </Link>
              </CardMeta>
              <CardActions>
                <CopyLinkButton path={formPath} />
              </CardActions>
            </CardBody>
            <QrCode url={`${origin}${formPath}`} />
          </Card>
          <Card>
            <CardTitle>{t("page.emptyNoFeedback.csvTitle")}</CardTitle>
            <CardText>{t.rich("page.emptyNoFeedback.csvText", { b: (chunks) => <b>{chunks}</b> })}</CardText>
            <CardActions>
              <Link href="/collect#csv" className={buttonVariants({ variant: "secondary" })}>
                {t("page.emptyNoFeedback.chooseFile")}
              </Link>
            </CardActions>
          </Card>
          <Card>
            <CardTitle>{t("page.emptyNoFeedback.pasteTitle")}</CardTitle>
            <CardText>{t("page.emptyNoFeedback.pasteText")}</CardText>
            <CardActions>
              <Link href="/collect#manual" className={buttonVariants({ variant: "secondary" })}>
                {t("page.emptyNoFeedback.pasteAction")}
              </Link>
            </CardActions>
          </Card>
        </div>
      </div>
    </Page>
  )
}

function EmptyNoAnalysis({
  dashboard,
  usage,
  locale,
  t,
  tCommon,
}: {
  dashboard: Awaited<ReturnType<typeof getDashboard>>
  usage: Usage
  locale: Locale
  t: Awaited<ReturnType<typeof getTranslations<"themes">>>
  tCommon: Awaited<ReturnType<typeof getTranslations<"common">>>
}) {
  const month = formatMonth(new Date(), locale)
  const remaining = usage.analysesLimit - usage.analysesThisMonth
  return (
    <>
      <PageHeader>
        <div>
          <PageTitle>{t("page.emptyNoAnalysis.title", { count: dashboard.feedbackCount })}</PageTitle>
          <PageLede>{t("page.emptyNoAnalysis.lede")}</PageLede>
        </div>
      </PageHeader>
      <Card variant="soft" layout="row" className="mb-8">
        <div>
          <CardTitle>{t("page.emptyNoAnalysis.readyTitle")}</CardTitle>
          <CardText>
            {localeList(
              dashboard.channels.map((c) => t("page.emptyNoAnalysis.channelLine", { count: c.count, name: c.name })),
              locale
            )}
            .{" "}
            {remaining === usage.analysesLimit
              ? t("page.emptyNoAnalysis.quotaFirst", { limit: usage.analysesLimit, month })
              : t("page.emptyNoAnalysis.quotaRemaining", { remaining, month })}
          </CardText>
        </div>
        <AnalyzeButton
          label={t("page.emptyNoAnalysis.analyzeLabel", { count: dashboard.feedbackCount })}
          limitNote={analysisLimitNote(usage, tCommon, locale)}
        />
      </Card>
      <div className="grid grid-cols-2 gap-x-12">
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
