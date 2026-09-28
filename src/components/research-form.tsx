"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { createResearch, type CreateResearchResult } from "@/app/(app)/research/actions"
import { focusNextResearchTitle } from "@/components/research-title"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RESEARCH_QUESTION_MAX_LENGTH } from "@/lib/plans"

type Failure = Extract<CreateResearchResult, { ok: false }>["reason"]

// The question field of the first run and of /research/new: one field, one button, the RC errors.
// Enter sends (the browser does not send while an input method is composing). The field has the
// focus when the page opens and gets it back after a field error; the text always stays.
export function ResearchForm({ cancelHref }: { cancelHref?: string }) {
  const t = useTranslations("research.form")
  const router = useRouter()
  const field = useRef<HTMLInputElement>(null)
  const [question, setQuestion] = useState("")
  const [failure, setFailure] = useState<Failure | null>(null)
  const [pending, startTransition] = useTransition()

  const length = [...question.trim()].length
  const fieldError = failure === "invalid" ? t("errors.empty") : failure === "too_long" ? t("errors.tooLong") : null

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    setFailure(null)
    startTransition(async () => {
      const result: CreateResearchResult = await createResearch(question).catch(() => ({
        ok: false as const,
        reason: "failed" as const,
      }))
      if (result.ok) {
        // The page of the new Research announces the arrival: its title takes the focus.
        focusNextResearchTitle()
        router.push(`/research/${result.id}`)
        return
      }
      setFailure(result.reason)
      if (result.reason === "invalid" || result.reason === "too_long") field.current?.focus()
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex max-w-[860px] flex-col items-start gap-4 sm:flex-row">
      <Field className="flex-1">
        <FieldLabel htmlFor="research-question">{t("label")}</FieldLabel>
        <Input
          ref={field}
          id="research-question"
          autoFocus
          value={question}
          readOnly={pending}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "research-question-error" : "research-question-hint"}
          onChange={(event) => {
            setQuestion(event.target.value)
            if (failure === "invalid" || failure === "too_long") setFailure(null)
          }}
        />
        <div className="flex justify-between gap-4">
          {fieldError ? (
            <FieldError id="research-question-error">{fieldError}</FieldError>
          ) : (
            <FieldHint id="research-question-hint">{t("hint")}</FieldHint>
          )}
          <FieldCount>{t("count", { count: length, max: RESEARCH_QUESTION_MAX_LENGTH })}</FieldCount>
        </div>
      </Field>
      <div className="mt-7 flex max-w-[36ch] flex-col gap-2">
        <div className="flex items-center gap-4">
          <Button type="submit" aria-disabled={pending || undefined}>
            {pending ? t("creating") : t("create")}
          </Button>
          {cancelHref && (
            <Link href={cancelHref} className={buttonVariants({ variant: "link" })}>
              {t("cancel")}
            </Link>
          )}
        </div>
        <p role="status" className="text-sm empty:hidden">
          {failure === "failed" && <span className="text-problem">{t("errors.failed")}</span>}
          {failure === "session" && (
            <span className="text-problem">
              {t("errors.session")}{" "}
              <Link href="/login" className={buttonVariants({ variant: "link", className: "text-sm" })}>
                {t("errors.sessionLink")}
              </Link>
            </span>
          )}
        </p>
      </div>
    </form>
  )
}
