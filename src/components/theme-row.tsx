import Link from "next/link"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Quote } from "@/components/quote"
import { ThemeControls } from "@/components/theme-controls"
import { Trend, TrendNote } from "@/components/trend"
import type { ThemeSummary } from "@/lib/data"
import { formatDate, KIND_LABELS, SENTIMENT_LABELS } from "@/lib/format"

// Kit: .theme, three columns (number and trend, content, controls).
// Compact from the fourth theme on: no summary, one quote.
export function ThemeRow({ theme, compact = false }: { theme: ThemeSummary; compact?: boolean }) {
  const quotes = theme.quotes.slice(0, compact ? 1 : 2)
  return (
    <article
      className={cn(
        "grid grid-cols-[148px_1fr_168px] gap-8 border-b border-line",
        compact ? "py-6" : "py-8"
      )}
    >
      <div>
        <Stat value={theme.feedbackCount} label={compact ? undefined : "feedback"} compact={compact} />
        <Trend weeks={theme.trend} compact={compact} />
        {!compact && <TrendNote />}
      </div>
      <div>
        <div className="flex items-baseline gap-4">
          <Badge variant={theme.kind}>{KIND_LABELS[theme.kind]}</Badge>
          <span className="text-sm text-ink-muted">{SENTIMENT_LABELS[theme.sentiment]}</span>
        </div>
        <h2
          className={cn(
            "my-2 leading-snug font-bold tracking-snug",
            compact ? "text-2xl" : "text-3xl"
          )}
        >
          <Link href={`/themes/${theme.id}`} className="hover:underline">
            {theme.title}
          </Link>
        </h2>
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
              cite={`${q.channel}, ${formatDate(q.receivedAt)}`}
              size={compact ? "sm" : "default"}
            />
          ))}
        </div>
        {!compact && (
          <Link href={`/themes/${theme.id}`} className={buttonVariants({ variant: "link" })}>
            Leggi tutti i {theme.feedbackCount} feedback
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
