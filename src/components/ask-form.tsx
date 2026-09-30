"use client"

import { CornerDownLeft, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { ask, type AskResult, type AskUsage } from "@/app/(app)/research/[id]/ask/actions"
import { AskAnswer } from "@/components/ask-answer"
import { askErrors, answerSummary, askButtonLabel, failedMessage, limitNotice, quotaNote, slowMessage, type AskT } from "@/components/ask-copy"
import { AskProgress, useElapsed } from "@/components/ask-progress"
import { askSession, beginAsking, clearMissed, endAsking, useAskSession, type AskFailure } from "@/components/ask-session"
import { suggestQuestions } from "@/components/ask-suggestions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { AskTopics } from "@/lib/data"
import type { Plan } from "@/lib/types"

const MAX_LENGTH = 300
const COUNT_FROM = 250
const SLOW_AFTER_MS = 15_000

type Failure = AskFailure

// The Chiedi tab: the question field, then the questions of this visit, newest on top. One question
// in flight at a time. Enter sends, Shift+Enter goes to a new line. The focus stays in the field from
// start to answer; the question moves to the top of the page while Voce works, and an error puts it back. Suggested questions
// and follow-ups fill the field and give it the focus, they never send: each question counts.
// The answers live in the browser's memory (ask-session): they stay across the tabs of the app and go
// away with a reload, and the page says so.
export function AskForm({
  researchId,
  feedbackConsidered,
  feedbackTotal,
  plan,
  usage: initialUsage,
  month,
  nextMonth,
  topics,
}: {
  researchId: string
  feedbackConsidered: number
  feedbackTotal: number
  plan: Plan
  usage: AskUsage
  month: string
  nextMonth: string
  topics: AskTopics
}) {
  const t = useTranslations("ask")
  const field = useRef<HTMLTextAreaElement>(null)
  const { entries, pending } = useAskSession(researchId)
  // A question that failed while the PM was on another tab: shown now, with the question back in the field.
  const [missed] = useState(() => askSession(researchId).missed)
  const [question, setQuestion] = useState(missed?.question ?? "")
  const [failure, setFailure] = useState<Failure | null>(missed?.failure ?? null)
  // What the status region says once the question is over: the answer, or that it was copied. The
  // count makes the same text, copied twice, a new announcement.
  const [announcement, setAnnouncement] = useState({ text: "", count: 0 })
  const announce = (text: string) => setAnnouncement((a) => ({ text, count: a.count + 1 }))
  // Null only right after the quota could not be read following an answered question: the quota
  // note is then left out rather than showing a stale number.
  const [usage, setUsage] = useState<AskUsage | null>(missed?.usage ?? initialUsage)
  const [currentPlan, setCurrentPlan] = useState(missed?.plan ?? plan)
  // Whether this form is on screen when the answer arrives: if not, a failure waits in the session.
  const onScreen = useRef(false)
  // Set at once on submit: two Enters in a row make one call, before React re-renders.
  const sending = useRef(false)
  // After a suggestion fills the field, the caret goes to its end once the value is on screen.
  const caretToEnd = useRef(false)
  const slow = useElapsed(pending?.startedAt ?? null) >= SLOW_AFTER_MS
  const latestId = entries[0]?.id

  useEffect(() => {
    onScreen.current = true
    if (missed) clearMissed(researchId)
    return () => {
      onScreen.current = false
    }
  }, [missed, researchId])

  // At a high zoom the answer can land below the fold: bring it into view, without animation.
  useEffect(() => {
    const latest = latestId && document.getElementById("ask-latest")
    if (latest && latest.getBoundingClientRect().top > window.innerHeight) latest.scrollIntoView({ block: "start" })
  }, [latestId])

  useEffect(() => {
    if (!caretToEnd.current) return
    caretToEnd.current = false
    const el = field.current
    if (el) el.setSelectionRange(el.value.length, el.value.length)
  }, [question])

  const length = question.replace(/\s*[\r\n]+\s*/g, " ").trim().length
  const tooLong = length > MAX_LENGTH
  const invalid = failure === "invalid" ? (tooLong ? "tooLong" : "empty") : tooLong ? "tooLong" : null
  const limitReached = failure === "limit" || (usage !== null && usage.used >= usage.quota)
  const notice = limitReached && usage ? limitNotice(t, currentPlan, usage.quota, month, nextMonth) : null
  const asked = new Set(entries.map((e) => e.result.question))
  const suggestions = suggestQuestions(t, topics).filter((s) => !asked.has(s.question))

  function fill(text: string) {
    if (pending) return
    caretToEnd.current = true
    setQuestion(text)
    setFailure(null)
    setAnnouncement({ text: "", count: 0 })
    field.current?.focus()
  }

  function submit() {
    if (sending.current || askSession(researchId).pending || limitReached) return
    if (length === 0 || tooLong) {
      setFailure("invalid")
      field.current?.focus()
      return
    }
    sending.current = true
    setFailure(null)
    setAnnouncement({ text: "", count: 0 })
    // The question moves from the field to the top of the page while Voce works; a failure puts it back.
    const sent = question
    setQuestion("")
    beginAsking(researchId, sent.trim())
    void (async () => {
      let result: AskResult | null = null
      try {
        result = await ask(researchId, { question: sent })
      } catch {
        // Nothing reached the server, or its answer did not reach the browser.
      }
      if (result?.ok) {
        endAsking(researchId, result, onScreen.current)
        setUsage(result.usage)
        announce(answerSummary(t, result.outcome === "answered" ? { ...result, quoteCount: result.quotes.length } : result))
      } else {
        const failure = result ?? { reason: "network" as const }
        // The plan or the quota can have changed since the page loaded (upgrade from another
        // tab, month rollover): the notice must use what the server saw, not the page's props.
        const missed = {
          question: sent,
          failure: failure.reason,
          usage: "usage" in failure ? failure.usage : undefined,
          plan: "plan" in failure ? failure.plan : undefined,
        }
        endAsking(researchId, missed, onScreen.current)
        setQuestion(sent)
        setFailure(missed.failure)
        if (missed.usage) setUsage(missed.usage)
        if (missed.plan) setCurrentPlan(missed.plan)
      }
      sending.current = false
      const el = field.current
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    })()
  }

  return (
    <>
      {notice && (
        <Card variant="soft" layout="row" className="mb-8">
          <div>
            <CardTitle>{notice.title}</CardTitle>
            <CardText>{notice.text}</CardText>
          </div>
          {notice.upgrade && (
            <Link href="/billing" className={buttonVariants()}>
              {t("form.upgrade")}
            </Link>
          )}
        </Card>
      )}
      <form
        className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field className="flex-1">
          <FieldLabel htmlFor="ask-question">{t("form.label")}</FieldLabel>
          <Textarea
            ref={field}
            id="ask-question"
            variant="ask"
            rows={2}
            autoFocus={!notice}
            value={question}
            readOnly={Boolean(pending)}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? "ask-error" : "ask-hint"}
            onChange={(event) => {
              setQuestion(event.target.value)
              if (failure === "invalid") setFailure(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                submit()
              }
            }}
          />
          {length >= COUNT_FROM && <FieldCount>{t("form.count", { length, max: MAX_LENGTH })}</FieldCount>}
          {invalid ? (
            <FieldError id="ask-error">{askErrors(t, researchId)[invalid === "tooLong" ? "tooLong" : "empty"]}</FieldError>
          ) : (
            <FieldHint id="ask-hint" className="hidden sm:block">
              {t("form.hint")}
            </FieldHint>
          )}
        </Field>
        <div className="flex flex-col gap-2 sm:mt-7 sm:max-w-[36ch]">
          <Button type="submit" size="lg" aria-disabled={Boolean(pending) || limitReached || undefined}>
            {pending ? t("form.sending") : askButtonLabel(t, feedbackConsidered, feedbackTotal)}
          </Button>
          {!pending && !limitReached && (!failure || failure === "invalid") && usage && (
            <p className="text-sm text-ink-muted">{quotaNote(t, usage, month)}</p>
          )}
        </div>
      </form>

      <div role="status" className="mt-6 empty:hidden">
        {pending ? (
          <span className="sr-only">{slow ? slowMessage(t) : t("form.reading", { count: feedbackConsidered })}</span>
        ) : (
          <>
            {failure && failure !== "invalid" && (
              <FailureNote t={t} researchId={researchId} failure={failure} usage={usage} month={month} notice={notice} />
            )}
            {announcement.text && (
              <span key={announcement.count} className="sr-only">
                {announcement.text}
              </span>
            )}
          </>
        )}
      </div>

      {entries.length === 0 && !pending && !limitReached && suggestions.length > 0 && (
        <section aria-labelledby="ask-suggest-title" className="mt-10">
          <h2 id="ask-suggest-title" className="mb-2 text-md font-semibold">
            {t("suggest.title")}
          </h2>
          <ul className="border-t border-line">
            {suggestions.map((s) => (
              <li key={s.question} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => fill(s.question)}
                  className="group -mx-3 flex w-[calc(100%+24px)] cursor-pointer items-center gap-4 rounded-sm px-3 py-4 text-left hover:bg-veil"
                >
                  <span className="flex-1 text-lg leading-snug">{s.question}</span>
                  {s.source !== "starter" && (
                    <span className="hidden shrink-0 text-sm text-ink-muted sm:inline">
                      {t(s.source === "hypothesis" ? "suggest.fromHypothesis" : "suggest.fromTheme")}
                    </span>
                  )}
                  <CornerDownLeft aria-hidden="true" className="size-4 shrink-0 text-ink-muted group-hover:text-ink" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(pending || entries.length > 0) && (
        <div className="mt-10">
          {pending && (
            <AskProgress
              question={pending.question}
              startedAt={pending.startedAt}
              feedbackConsidered={feedbackConsidered}
              feedbackTotal={feedbackTotal}
            />
          )}
          {entries.map((entry) => (
            <div key={entry.id} id={entry.id === latestId && !pending ? "ask-latest" : undefined}>
              <AskAnswer
                result={entry.result}
                latest={entry.id === latestId && !pending}
                canFollowUp={!limitReached}
                onFollowUp={fill}
                onAnnounce={announce}
              />
            </div>
          ))}
          {entries.length > 0 && <p className="mt-8 border-t border-line pt-4 text-sm text-ink-muted">{t("answer.session")}</p>}
        </div>
      )}
    </>
  )
}

function FailureNote({
  t,
  researchId,
  failure,
  usage,
  month,
  notice,
}: {
  t: AskT
  researchId: string
  failure: Failure
  usage: AskUsage | null
  month: string
  notice: { title: string; text: string } | null
}) {
  const errors = askErrors(t, researchId)
  let content: ReactNode = null
  switch (failure) {
    case "limit":
      // The E3/E4 notice already shows above the field: read it here too, so a screen reader
      // hears that the quota ran out instead of the status region staying silent.
      if (notice)
        return (
          <span className="sr-only">
            {notice.title}. {notice.text}
          </span>
        )
      return null
    case "busy":
      content = errors.busy
      break
    case "failed":
      content = usage ? failedMessage(t, usage, month) : null
      break
    case "network":
      content = errors.network
      break
    case "session":
    case "no_feedback":
    case "not_found": {
      const copy = failure === "session" ? errors.session : failure === "no_feedback" ? errors.noFeedback : errors.notFound
      content = (
        <>
          {copy.text}{" "}
          <Link href={copy.href} className={buttonVariants({ variant: "link", className: "text-base" })}>
            {copy.link}
          </Link>
        </>
      )
      break
    }
  }
  if (!content) return null
  return (
    <p className="flex max-w-[72ch] items-start gap-3 text-base leading-normal text-problem">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span>{content}</span>
    </p>
  )
}
