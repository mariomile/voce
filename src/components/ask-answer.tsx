import { useLocale, useTranslations } from "next-intl"
import type { AskResult } from "@/app/(app)/research/[id]/ask/actions"
import { countLabel } from "@/components/ask-copy"
import { Quote } from "@/components/quote"
import { Stat } from "@/components/theme-row"
import { formatDate } from "@/lib/format"

type Answer = Extract<AskResult, { ok: true }>

// The answer to one question: the number counted by the server, the text written by Voce (sans),
// then the customers' own verified words (serif). Everything is rendered as text.
export function AskAnswer({ result }: { result: Answer }) {
  const t = useTranslations("ask")
  const locale = useLocale()
  const keep = t("answer.keep")
  return (
    <section aria-labelledby="ask-answer-heading" className="mt-10 border-t-2 border-ink pt-6">
      <h2 id="ask-answer-heading" className="mb-6 text-md font-normal text-ink-muted">
        {t("answer.heading", { question: result.question })}
      </h2>
      {result.outcome === "no_evidence" ? (
        <>
          <p className="mb-3 font-serif text-5xl leading-snug font-normal tracking-snug">{t("answer.noEvidenceTitle")}</p>
          <p className="max-w-[58ch] text-lg leading-relaxed text-ink-muted">
            {t("answer.noEvidenceBody", { count: result.feedbackConsidered })}
          </p>
        </>
      ) : (
        <div className="grid grid-cols-[148px_1fr] gap-8">
          <div>
            <Stat value={result.feedbackCount} label={countLabel(t, result.feedbackCount)} />
          </div>
          <div>
            <p className="mb-8 max-w-[58ch] text-3xl leading-snug font-medium">{result.answer}</p>
            <p className="mb-4 text-md font-semibold">
              {result.feedbackCount > result.quotes.length
                ? t("answer.writtenPartial", { quotes: result.quotes.length, total: result.feedbackCount })
                : t("answer.writtenAll")}
            </p>
            <div className="mb-8 flex flex-col gap-6">
              {result.quotes.map((q, i) => (
                <Quote
                  key={i}
                  text={q.text}
                  highlight={q.highlight}
                  cite={`${q.channel}, ${formatDate(q.receivedAt, locale)}`}
                />
              ))}
            </div>
            <p className="max-w-[64ch] text-sm text-ink-muted">
              {result.feedbackTotal > result.feedbackConsidered
                ? t("answer.perimeterPartial", { considered: result.feedbackConsidered, total: result.feedbackTotal, keep })
                : t("answer.perimeterFull", { count: result.feedbackConsidered, keep })}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
