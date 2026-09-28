"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { ask, type AskResult, type AskUsage } from "@/app/(app)/ask/actions"
import { AskAnswer } from "@/components/ask-answer"
import { askErrors, answerSummary, askButtonLabel, failedMessage, limitNotice, quotaNote, slowMessage, type AskT } from "@/components/ask-copy"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { Plan } from "@/lib/types"

const MAX_LENGTH = 300
const COUNT_FROM = 250
const SLOW_AFTER_MS = 15_000

type Failure = Extract<AskResult, { ok: false }>["reason"] | "network"

// One question at a time. Enter sends, Shift+Enter goes to a new line. The answer lives only on
// this page: a new question replaces it. The focus stays in the field from start to answer, and
// errors keep the question in the field.
export function AskForm({
  feedbackConsidered,
  feedbackInWindow,
  plan,
  usage: initialUsage,
  month,
  nextMonth,
}: {
  feedbackConsidered: number
  feedbackInWindow: number
  plan: Plan
  usage: AskUsage
  month: string
  nextMonth: string
}) {
  const t = useTranslations("ask")
  const field = useRef<HTMLTextAreaElement>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<Extract<AskResult, { ok: true }> | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  // Null only right after the quota could not be read following an answered question: the quota
  // note is then left out rather than showing a stale number.
  const [usage, setUsage] = useState<AskUsage | null>(initialUsage)
  const [currentPlan, setCurrentPlan] = useState(plan)
  const [pending, startTransition] = useTransition()
  const [slow, setSlow] = useState(false)
  // Set at once on submit: two Enters in a row make one call, before React re-renders.
  const sending = useRef(false)

  // At a high zoom the answer can land below the fold: bring its heading into view, without animation.
  useEffect(() => {
    const heading = answer && document.getElementById("ask-answer-heading")
    if (heading && heading.getBoundingClientRect().top > window.innerHeight) heading.scrollIntoView({ block: "start" })
  }, [answer])

  useEffect(() => {
    if (!pending) return
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [pending])

  const length = question.replace(/\s*[\r\n]+\s*/g, " ").trim().length
  const tooLong = length > MAX_LENGTH
  const invalid = failure === "invalid" ? (tooLong ? "tooLong" : "empty") : tooLong ? "tooLong" : null
  const limitReached = failure === "limit" || (usage !== null && usage.used >= usage.quota)
  const notice = limitReached && usage ? limitNotice(t, currentPlan, usage.quota, month, nextMonth) : null

  function submit() {
    if (sending.current || pending || limitReached) return
    if (length === 0 || tooLong) {
      setFailure("invalid")
      field.current?.focus()
      return
    }
    sending.current = true
    setFailure(null)
    setAnswer(null)
    startTransition(async () => {
      try {
        const result = await ask({ question })
        if (result.ok) {
          setAnswer(result)
          setUsage(result.usage)
        } else {
          setFailure(result.reason)
          if (result.reason === "failed") setUsage(result.usage)
          // The plan or the quota can have changed since the page loaded (upgrade from another
          // tab, month rollover): the notice must use what the server saw, not the page's props.
          if (result.reason === "limit") {
            setUsage(result.usage)
            setCurrentPlan(result.plan)
          }
        }
      } catch {
        setFailure("network")
      }
      sending.current = false
      const el = field.current
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    })
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
        className="flex items-start gap-6"
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
            readOnly={pending}
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
            <FieldError id="ask-error">{askErrors(t)[invalid === "tooLong" ? "tooLong" : "empty"]}</FieldError>
          ) : (
            <FieldHint id="ask-hint">{t("form.hint")}</FieldHint>
          )}
        </Field>
        <div className="mt-7 flex max-w-[36ch] flex-col gap-2">
          <Button type="submit" size="lg" aria-disabled={pending || limitReached || undefined}>
            {pending ? t("form.sending") : askButtonLabel(t, feedbackConsidered, feedbackInWindow)}
          </Button>
          <p role="status" className="text-sm text-ink-muted empty:hidden">
            {pending ? (
              slow ? slowMessage(t) : t("form.reading", { count: feedbackConsidered })
            ) : answer ? (
              <span className="sr-only">
                {answerSummary(
                  t,
                  answer.outcome === "answered"
                    ? { ...answer, quoteCount: answer.quotes.length }
                    : answer
                )}
              </span>
            ) : (
              <FailureNote t={t} failure={failure} usage={usage} month={month} notice={notice} />
            )}
          </p>
          {!pending && !limitReached && (!failure || failure === "invalid") && usage && (
            <p className="text-sm text-ink-muted">{quotaNote(t, usage, month)}</p>
          )}
        </div>
      </form>
      {answer && <AskAnswer result={answer} />}
    </>
  )
}

function FailureNote({
  t,
  failure,
  usage,
  month,
  notice,
}: {
  t: AskT
  failure: Failure | null
  usage: AskUsage | null
  month: string
  notice: { title: string; text: string } | null
}) {
  const errors = askErrors(t)
  switch (failure) {
    case "limit":
      // The E3/E4 notice already shows above the field: read it here too, so a screen reader
      // hears that the quota ran out instead of the status region staying silent.
      return notice ? (
        <span className="text-problem">
          {notice.title}. {notice.text}
        </span>
      ) : null
    case "busy":
      return <span className="text-problem">{errors.busy}</span>
    case "failed":
      return usage ? <span className="text-problem">{failedMessage(t, usage, month)}</span> : null
    case "network":
      return <span className="text-problem">{errors.network}</span>
    case "session":
    case "no_feedback": {
      const copy = failure === "session" ? errors.session : errors.noFeedback
      return (
        <span className="text-problem">
          {copy.text}{" "}
          <Link href={copy.href} className={buttonVariants({ variant: "link", className: "text-sm" })}>
            {copy.link}
          </Link>
        </span>
      )
    }
    default:
      return null
  }
}
