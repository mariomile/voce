"use client"

import { useState, useTransition } from "react"
import { ask, type AskResult } from "@/app/(app)/ask/actions"
import { AskAnswer } from "@/components/ask-answer"
import { Button } from "@/components/ui/button"
import { Field, FieldHint, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

// One question at a time. Enter sends, Shift+Enter goes to a new line. The answer lives only on
// this page: a new question replaces it.
export function AskForm({ feedbackConsidered }: { feedbackConsidered: number }) {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<AskResult | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    if (pending) return
    setResult(null)
    startTransition(async () => {
      setResult(await ask({ question }))
    })
  }

  return (
    <>
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
            id="ask-question"
            rows={2}
            autoFocus
            value={question}
            readOnly={pending}
            aria-describedby="ask-hint"
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                submit()
              }
            }}
          />
          <FieldHint id="ask-hint">Per esempio: cosa chiedono i clienti sull&apos;export in Excel?</FieldHint>
        </Field>
        <div className="mt-7 flex max-w-[36ch] flex-col gap-2">
          <Button type="submit" size="lg" aria-disabled={pending || undefined}>
            {pending ? "Risposta in arrivo…" : `Chiedi ai ${feedbackConsidered} feedback`}
          </Button>
          <p role="status" className="text-sm text-ink-muted empty:hidden">
            {pending ? `Sto leggendo ${feedbackConsidered} feedback…` : ""}
          </p>
        </div>
      </form>
      {result?.ok && <AskAnswer result={result} />}
    </>
  )
}
