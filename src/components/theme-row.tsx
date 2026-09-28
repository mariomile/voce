import Link from "next/link"
import { cn } from "cn"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Quote } from "@/components/quote"
import { ThemeControls } from "@/components/theme-controls"
import { Trend, TrendNote } from "@/components/trend"
import type { ThemeSummary } from "@/lib/data"
import { formatDate } from "@/lib/format"

// Kit: .theme, three columns (number and trend, content, controls).
// Compact from the fourth theme on: no summary, one quote. Under the number, how the theme moved since
// the previous analysis of the Research: "+{k} dal {data}" or "Nuovo".
export function ThemeRow({ theme, compact = false }: { theme: ThemeSummary; compact?: boolean }) {
  const t = useTranslations("themes")
  const tCommon = useTranslations("common")
  const tChanges = useTranslations("research.synthesis.changes")
  const locale = useLocale()
  const quotes = theme.quotes.slice(0, compact ? 1 : 2)
  const href = `/research/${theme.researchId}/themes/${theme.id}`
  return (
    <article
      className={cn(
        "grid grid-cols-[148px_1fr_168px] gap-8 border-b border-line",
        compact ? "py-6" : "py-8"
      )}
    >
      <div>
        <Stat value={theme.feedbackCount} label={compact ? undefined : t("row.feedbackLabel")} compact={compact} />
        {theme.change?.kind === "more" && (
          <div className="mt-1 text-sm text-ink-muted tabular-nums">
            {tChanges("themeDelta", { count: theme.change.count, date: formatDate(theme.change.since, locale) })}
          </div>
        )}
        {theme.change?.kind === "new" && (
          <Badge className="mt-2">
            {tChanges("newTheme")}
          </Badge>
        )}
        <Trend weeks={theme.trend} compact={compact} />
        {!compact && <TrendNote />}
      </div>
      <div>
        <div className="flex items-baseline gap-4">
          <Badge variant={theme.kind}>{tCommon(`kind.${theme.kind}`)}</Badge>
          <span className="text-sm text-ink-muted">{tCommon(`sentiment.${theme.sentiment}`)}</span>
        </div>
        <h3
          className={cn(
            "my-2 leading-snug font-bold tracking-snug",
            compact ? "text-2xl" : "text-3xl"
          )}
        >
          <Link href={href} className="hover:underline">
            {theme.title}
          </Link>
        </h3>
        {!compact && (
          <p className="mb-5 max-w-[64ch] text-base leading-relaxed text-ink-muted">
            {theme.summary}
          </p>
        )}
        <div className="mb-4 flex flex-col gap-4 last:mb-0">
          {quotes.map((q) => (
            <Quote
              key={q.feedbackId}
              text={q.text}
              highlight={q.highlight}
              cite={`${q.channel}, ${formatDate(q.receivedAt, locale)}`}
              size={compact ? "sm" : "default"}
            />
          ))}
        </div>
        {!compact && (
          <Link href={href} className={buttonVariants({ variant: "link" })}>
            {t("row.readAll", { count: theme.feedbackCount })}
          </Link>
        )}
      </div>
      <ThemeControls themeId={theme.id} priority={theme.priority} status={theme.status} />
    </article>
  )
}

export function Stat({
  value,
  label,
  compact = false,
}: {
  value: number
  label?: string
  compact?: boolean
}) {
  return (
    <>
      <div
        className={cn(
          "leading-none font-bold tracking-numbers tabular-nums",
          compact ? "text-4xl" : "text-6xl"
        )}
      >
        {value}
      </div>
      {label && <div className="mt-1 text-md text-ink-muted">{label}</div>}
    </>
  )
}
