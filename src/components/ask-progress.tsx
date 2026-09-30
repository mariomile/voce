"use client"

import { cn } from "cn"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { slowMessage } from "@/components/ask-copy"
import { PROGRESS_STEPS, progressStep } from "@/components/ask-format"

const SLOW_AFTER_MS = 15_000

// The question in flight, where its answer will appear: what Voce is doing, one step at a time. The
// server does not stream, so the steps follow the usual timing and the last waits for the answer. The
// status region of the tab says the same to a screen reader: this list is not live.
export function AskProgress({
  question,
  startedAt,
  feedbackConsidered,
  feedbackTotal,
}: {
  question: string
  startedAt: number
  feedbackConsidered: number
  feedbackTotal: number
}) {
  const t = useTranslations("ask")
  const elapsed = useElapsed(startedAt)
  const active = progressStep(elapsed)
  const steps = [
    feedbackTotal > feedbackConsidered
      ? t("progress.readPartial", { count: feedbackConsidered })
      : t("progress.read", { count: feedbackConsidered }),
    t("progress.search"),
    t("progress.check"),
  ].slice(0, PROGRESS_STEPS)

  return (
    <section aria-label={t("form.sending")} className="border-t-2 border-ink pt-6 pb-10">
      <h2 className="mb-6 max-w-[52ch] text-2xl leading-snug font-bold">{question}</h2>
      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-lg leading-snug">
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                i < active && "bg-ink text-highlight",
                i === active && "bg-highlight shadow-[inset_0_0_0_2px_var(--color-ink)]",
                i > active && "shadow-[inset_0_0_0_1.5px_var(--color-line-strong)]"
              )}
            >
              {i < active && <Check className="size-4" strokeWidth={3} />}
            </span>
            <span className={cn(i === active && "highlighter-sweep", i > active && "text-ink-muted")}>{step}</span>
          </li>
        ))}
      </ol>
      {elapsed >= SLOW_AFTER_MS && <p className="mt-6 max-w-[58ch] text-base text-ink-muted">{slowMessage(t)}</p>}
    </section>
  )
}

export function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startedAt === null) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [startedAt])
  return startedAt === null ? 0 : Math.max(0, now - startedAt)
}
