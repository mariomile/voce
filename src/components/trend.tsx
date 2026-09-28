import { cn } from "cn"
import { useTranslations } from "next-intl"

// Kit: .trend. One bar per week, the last 2 in ink.
export function Trend({ weeks, compact = false }: { weeks: number[]; compact?: boolean }) {
  const t = useTranslations("themes.trend")
  const max = Math.max(...weeks, 1)
  return (
    <div
      role="img"
      aria-label={t("ariaLabel", { weeks: weeks.join(", ") })}
      className={cn("flex items-end gap-[3px]", compact ? "mt-3 h-6" : "mt-4 h-10")}
    >
      {weeks.map((count, i) => (
        <i
          key={i}
          className={cn(
            "min-h-[2px] flex-1 rounded-[1px]",
            i >= weeks.length - 2 ? "bg-ink" : "bg-line-strong"
          )}
          style={{ height: `${Math.max(6, (count / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export function TrendNote() {
  const t = useTranslations("themes.trend")
  return <p className="mt-2 text-xs leading-normal text-ink-subtle">{t("note")}</p>
}
