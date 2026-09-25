import { cn } from "cn"

// Kit: .trend. One bar per week, the last 2 in ink.
export function Trend({ weeks, compact = false }: { weeks: number[]; compact?: boolean }) {
  const max = Math.max(...weeks, 1)
  return (
    <div
      role="img"
      aria-label={`Feedback per settimana: ${weeks.join(", ")}`}
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
  return (
    <p className="mt-2 text-xs leading-normal text-ink-subtle">
      Ultime 13 settimane. In nero le ultime 2.
    </p>
  )
}
