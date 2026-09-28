import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { Quote } from "@/components/quote"
import { ThemeControls } from "@/components/theme-controls"
import { Stat } from "@/components/theme-row"
import { Trend, TrendNote } from "@/components/trend"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getResearch, getTheme } from "@/lib/data"
import { formatDate } from "@/lib/format"

// A theme of the Research, with every feedback linked to it. Part of the Sintesi tab.
export default async function ThemePage({ params }: PageProps<"/research/[id]/themes/[themeId]">) {
  const { id, themeId } = await params
  // Rendered alongside the layout, which shows the not-found page: getResearch is cached for the request.
  const research = await getResearch(id)
  if (!research) notFound()
  const theme = await getTheme(research, themeId)
  if (!theme) notFound()

  const [locale, t, tCommon] = await Promise.all([
    getLocale(),
    getTranslations("themes"),
    getTranslations("common"),
  ])

  const quoteIds = new Set(theme.quotes.map((q) => q.feedbackId))
  const others = theme.feedback.filter((f) => !quoteIds.has(f.feedbackId))

  return (
    <>
      <p className="mb-8">
        <Link href={`/research/${research.id}`} className={buttonVariants({ variant: "link" })}>
          {t("detail.allThemes")}
        </Link>
      </p>

      <article className="grid grid-cols-[148px_1fr_168px] gap-8 border-b border-line pb-8">
        <div>
          <Stat value={theme.feedbackCount} label={t("row.feedbackLabel")} />
          <Trend weeks={theme.trend} />
          <TrendNote />
        </div>
        <div>
          <div className="flex items-baseline gap-4">
            <Badge variant={theme.kind}>{tCommon(`kind.${theme.kind}`)}</Badge>
            <span className="text-sm text-ink-muted">{tCommon(`sentiment.${theme.sentiment}`)}</span>
          </div>
          <h2 className="my-2 text-4xl leading-tight font-bold tracking-tight">{theme.title}</h2>
          <p className="mb-6 max-w-[64ch] text-lg leading-relaxed text-ink-muted">{theme.summary}</p>
          <div className="flex flex-col gap-4">
            {theme.quotes.map((q) => (
              <Quote
                key={q.feedbackId}
                text={q.text}
                highlight={q.highlight}
                cite={`${q.channel}, ${formatDate(q.receivedAt, locale)}`}
              />
            ))}
          </div>
        </div>
        <ThemeControls themeId={theme.id} priority={theme.priority} status={theme.status} />
      </article>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl leading-snug font-bold">
            {t("detail.otherFeedback", { count: others.length })}
          </h2>
          <div className="grid grid-cols-2 gap-x-12">
            {others.map((f) => (
              <Quote
                key={f.feedbackId}
                text={f.text}
                size="sm"
                cite={`${f.channel}, ${formatDate(f.receivedAt, locale)}`}
                className="border-t border-line py-4"
              />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
