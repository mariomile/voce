"use client"

import { cn } from "cn"
import { Check, ChevronDown, Copy } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import type { AskQuote } from "@/app/(app)/research/[id]/ask/actions"
import { countLabel } from "@/components/ask-copy"
import {
  answerAsText,
  compactQuote,
  fullQuote,
  quoteSource,
  sharePercent,
  splitAnswer,
  type AskAnswered,
  type AskOutcome,
  type QuoteParts,
} from "@/components/ask-format"
import { followUps } from "@/components/ask-suggestions"
import { Stat } from "@/components/theme-row"
import { Button } from "@/components/ui/button"

// One question of the visit and its answer: the question as the title, the number counted by the server,
// the first sentence of the answer written by Voce (sans, large) and the rest under it, then the customers'
// own verified words (serif), short, each opening to the whole feedback. Everything renders as text.
// The latest answer is always open; earlier ones fold into one line that opens again.
export function AskAnswer({
  result,
  latest = true,
  canFollowUp = true,
  onFollowUp,
  onAnnounce,
}: {
  result: AskOutcome
  latest?: boolean
  canFollowUp?: boolean
  // Fills the question field; never sends.
  onFollowUp?: (question: string) => void
  // Read by the status region of the tab.
  onAnnounce?: (text: string) => void
}) {
  const t = useTranslations("ask")
  // A newer question folds this one; the PM can open it again.
  const [opened, setOpened] = useState(false)
  const open = latest || opened
  const count = result.outcome === "answered" ? result.feedbackCount : 0

  return (
    <section
      aria-label={t("answer.heading", { question: result.question })}
      className={cn(latest ? "border-t-2 border-ink pt-6 pb-4" : "border-t border-line")}
    >
      {latest ? (
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:gap-10">
          <h2 className="max-w-[52ch] text-2xl leading-snug font-bold">{result.question}</h2>
          <CopyButton result={result} onAnnounce={onAnnounce} />
        </div>
      ) : (
        <h2>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpened(!opened)}
            className="group grid w-full cursor-pointer grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-4 py-4 text-left"
          >
            <span className="text-3xl leading-none font-bold tracking-numbers tabular-nums">{count}</span>
            <span className="min-w-0">
              <span className="block text-lg leading-snug font-semibold group-hover:underline group-hover:decoration-ink-subtle group-hover:decoration-2 group-hover:underline-offset-4">
                {result.question}
              </span>
              {!open && (
                <span className="mt-1 block truncate text-base text-ink-muted">
                  {result.outcome === "answered" ? splitAnswer(result.answer).lead : t("answer.noEvidenceTitle")}
                </span>
              )}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn("size-5 self-center text-ink-muted transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </h2>
      )}
      {open && (
        <div className={cn(!latest && "pb-8")}>
          {!latest && (
            <div className="mb-6 flex justify-end">
              <CopyButton result={result} onAnnounce={onAnnounce} />
            </div>
          )}
          {result.outcome === "no_evidence" ? (
            <NoEvidence result={result} onFollowUp={canFollowUp ? onFollowUp : undefined} />
          ) : (
            <Answered result={result} onFollowUp={canFollowUp ? onFollowUp : undefined} />
          )}
        </div>
      )}
    </section>
  )
}

function NoEvidence({ result, onFollowUp }: { result: AskOutcome; onFollowUp?: (question: string) => void }) {
  const t = useTranslations("ask")
  return (
    <div className="max-w-[62ch]">
      <p className="mb-3 font-serif text-4xl leading-heading font-normal tracking-snug">{t("answer.noEvidenceTitle")}</p>
      <p className="text-lg leading-relaxed text-ink-muted">{t("answer.noEvidenceBody", { count: result.feedbackConsidered })}</p>
      {onFollowUp && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={() => onFollowUp(result.question)}>
          {t("followUp.rephrase")}
        </Button>
      )}
    </div>
  )
}

function Answered({ result, onFollowUp }: { result: AskAnswered; onFollowUp?: (question: string) => void }) {
  const t = useTranslations("ask")
  const { lead, rest } = splitAnswer(result.answer)
  const more = onFollowUp ? followUps(t, result) : []
  const share = sharePercent(result.feedbackCount, result.feedbackConsidered)
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[148px_1fr] sm:gap-10">
      <div className="flex items-baseline gap-4 sm:block">
        <Stat value={result.feedbackCount} />
        <p className="text-md sm:mt-2">
          <span className="block text-ink">{countLabel(t, result.feedbackCount)}</span>
          {share && <span className="block text-ink-muted">{t("answer.share", { percent: share, count: result.feedbackConsidered })}</span>}
        </p>
      </div>
      <div className="min-w-0">
        <p className="max-w-[44ch] text-3xl leading-snug font-semibold tracking-snug text-balance">{lead}</p>
        {rest && <p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-ink-muted">{rest}</p>}

        {result.quotes.length > 0 && (
          <>
            <h3 className="mt-10 mb-1 text-md font-semibold">
              {result.feedbackCount > result.quotes.length
                ? t("answer.writtenPartial", { quotes: result.quotes.length, total: result.feedbackCount })
                : t("answer.writtenAll")}
            </h3>
            <ul className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
              {result.quotes.map((quote, i) => (
                <AnswerQuote key={i} quote={quote} />
              ))}
            </ul>
          </>
        )}

        {more.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-md font-semibold">{t("followUp.label")}</span>
            {more.map((item) => (
              <Button key={item.label} variant="secondary" size="sm" onClick={() => onFollowUp?.(item.question)}>
                {item.label}
              </Button>
            ))}
          </div>
        )}

        {result.feedbackTotal > result.feedbackConsidered && (
          <p className="mt-6 max-w-[64ch] text-sm text-ink-muted">
            {t("answer.perimeterPartial", { considered: result.feedbackConsidered, total: result.feedbackTotal })}
          </p>
        )}
      </div>
    </div>
  )
}

// The key phrase the model cited, verified word for word; a long feedback opens to its whole text.
function AnswerQuote({ quote }: { quote: AskQuote }) {
  const t = useTranslations("ask")
  const locale = useLocale()
  const [whole, setWhole] = useState(false)
  const compact = compactQuote(quote.text, quote.highlight)
  const parts: QuoteParts = whole ? fullQuote(quote.text, quote.highlight) : compact
  return (
    <li className="border-b border-line py-5">
      <blockquote className="m-0 max-w-[58ch] font-serif text-xl leading-relaxed font-normal">
        “{parts.before}
        {parts.highlight && <mark>{parts.highlight}</mark>}
        {parts.after}”
        <cite className="mt-2 block font-sans text-sm text-ink-muted not-italic">{quoteSource(quote, locale)}</cite>
      </blockquote>
      {compact.shortened && (
        <Button variant="text" aria-expanded={whole} className="mt-2 text-sm" onClick={() => setWhole(!whole)}>
          {whole ? t("answer.readLess") : t("answer.readAll")}
        </Button>
      )}
    </li>
  )
}

function CopyButton({ result, onAnnounce }: { result: AskOutcome; onAnnounce?: (text: string) => void }) {
  const t = useTranslations("ask")
  const locale = useLocale()
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          clearTimeout(timer.current)
          try {
            await navigator.clipboard.writeText(answerAsText(t, result, locale))
            setState("copied")
            onAnnounce?.(t("answer.copiedStatus"))
            timer.current = setTimeout(() => setState("idle"), 2000)
          } catch {
            setState("failed")
            onAnnounce?.(t("answer.copyFailed"))
          }
        }}
      >
        {state === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
        {state === "copied" ? t("answer.copied") : t("answer.copy")}
      </Button>
      {state === "failed" && <p className="max-w-[36ch] text-sm text-problem sm:text-right">{t("answer.copyFailed")}</p>}
    </div>
  )
}
