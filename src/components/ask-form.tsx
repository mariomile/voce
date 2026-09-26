"use client"

import Link from "next/link"
import { useRef, useState, useTransition } from "react"
import { ask, type AskResult, type AskUsage } from "@/app/(app)/ask/actions"
import { AskAnswer } from "@/components/ask-answer"
import { ASK_ERRORS, failedMessage, limitNotice, quotaNote } from "@/components/ask-copy"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { Plan } from "@/lib/types"

const MAX_LENGTH = 300
const COUNT_FROM = 250

type Failure = Extract<AskResult, { ok: false }>["reason"] | "network"

// One question at a time. Enter sends, Shift+Enter goes to a new line. The answer lives only on
// this page: a new question replaces it. The focus stays in the field from start to answer, and
// errors keep the question in the field.
export function AskForm({
  feedbackConsidered,
  plan,
  usage: initialUsage,
  month,
  nextMonth,
}: {
  feedbackConsidered: number
  plan: Plan
  usage: AskUsage
  month: string
  nextMonth: string
}) {
  const field = useRef<HTMLTextAreaElement>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<Extract<AskResult, { ok: true }> | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [usage, setUsage] = useState(initialUsage)
  const [pending, startTransition] = useTransition()

  const length = question.replace(/\s*[\r\n]+\s*/g, " ").trim().length
  const tooLong = length > MAX_LENGTH
  const invalid = failure === "invalid" ? (tooLong ? "tooLong" : "empty") : tooLong ? "tooLong" : null
  const limitReached = failure === "limit" || usage.used >= usage.quota
  const notice = limitReached ? limitNotice(plan, usage.quota, month, nextMonth) : null

  function submit() {
    if (pending || limitReached) return
    if (length === 0 || tooLong) {
      setFailure("invalid")
      field.current?.focus()
      return
    }
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
        }
      } catch {
        setFailure("network")
      }
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
              Passa a Pro
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
          <FieldLabel htmlFor="ask-question">La tua domanda</FieldLabel>
          <Textarea
            ref={field}
            id="ask-question"
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
          {length >= COUNT_FROM && (
            <FieldCount>
              {length} di {MAX_LENGTH}
            </FieldCount>
          )}
          {invalid ? (
            <FieldError id="ask-error">{invalid === "tooLong" ? ASK_ERRORS.tooLong : ASK_ERRORS.empty}</FieldError>
          ) : (
            <FieldHint id="ask-hint">Per esempio: cosa chiedono i clienti sull&apos;export in Excel?</FieldHint>
          )}
        </Field>
        <div className="mt-7 flex max-w-[36ch] flex-col gap-2">
          <Button type="submit" size="lg" aria-disabled={pending || limitReached || undefined}>
            {pending ? "Risposta in arrivo…" : `Chiedi ai ${feedbackConsidered} feedback`}
          </Button>
          <p role="status" className="text-sm text-ink-muted empty:hidden">
            {pending ? `Sto leggendo ${feedbackConsidered} feedback…` : <FailureNote failure={failure} usage={usage} month={month} />}
          </p>
          {!pending && !limitReached && (!failure || failure === "invalid") && (
            <p className="text-sm text-ink-muted">{quotaNote(usage, month)}</p>
          )}
        </div>
      </form>
      {answer && <AskAnswer result={answer} />}
    </>
  )
}

function FailureNote({ failure, usage, month }: { failure: Failure | null; usage: AskUsage; month: string }) {
  switch (failure) {
    case "busy":
      return <span className="text-problem">{ASK_ERRORS.busy}</span>
    case "failed":
      return <span className="text-problem">{failedMessage(usage, month)}</span>
    case "network":
      return <span className="text-problem">{ASK_ERRORS.network}</span>
    case "session":
    case "no_feedback": {
      const copy = failure === "session" ? ASK_ERRORS.session : ASK_ERRORS.noFeedback
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
