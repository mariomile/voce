"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { updateResearchQuestion, type UpdateResearchQuestionResult } from "@/app/(app)/research/actions"
import { ResearchTitle } from "@/components/research-title"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RESEARCH_QUESTION_MAX_LENGTH } from "@/lib/plans"

type Failure = Extract<UpdateResearchQuestionResult, { ok: false }>["reason"]

// The question of a Research in the header of every tab, with "Modifica": the h1 becomes the question field
// with Salva and Annulla (F12). Only the name changes: themes, hypotheses and verdicts stay. Enter saves,
// Esc and Annulla close and give the focus back to "Modifica"; after a field error the focus is in the field.
export function ResearchQuestion({ researchId, question }: { researchId: string; question: string }) {
  const t = useTranslations("research.form")
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(question)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [pending, startTransition] = useTransition()
  const field = useRef<HTMLInputElement>(null)
  const edit = useRef<HTMLButtonElement>(null)
  const focusEdit = useRef(false)

  useEffect(() => {
    if (editing || !focusEdit.current) return
    focusEdit.current = false
    edit.current?.focus()
  }, [editing])

  function close() {
    if (pending) return
    focusEdit.current = true
    setFailure(null)
    setEditing(false)
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    setFailure(null)
    startTransition(async () => {
      const result: UpdateResearchQuestionResult = await updateResearchQuestion(researchId, value).catch(() => ({
        ok: false as const,
        reason: "failed" as const,
      }))
      if (result.ok) {
        focusEdit.current = true
        setEditing(false)
        return
      }
      setFailure(result.reason)
      if (result.reason === "invalid" || result.reason === "too_long") field.current?.focus()
    })
  }

  if (!editing)
    return (
      <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <ResearchTitle>{question}</ResearchTitle>
        <Button
          ref={edit}
          variant="text"
          className="text-md"
          aria-label={t("editLabel")}
          onClick={() => {
            setValue(question)
            setEditing(true)
          }}
        >
          {t("edit")}
        </Button>
      </div>
    )

  const length = [...value.trim()].length
  const fieldError = failure === "invalid" ? t("errors.empty") : failure === "too_long" ? t("errors.tooLong") : null
  return (
    <form
      noValidate
      onSubmit={save}
      onKeyDown={(event) => {
        if (event.key === "Escape") close()
      }}
      className="mb-2 flex max-w-[860px] flex-col items-start gap-4 sm:flex-row"
    >
      <Field className="w-full flex-1">
        <FieldLabel htmlFor="research-question-edit">{t("label")}</FieldLabel>
        <Input
          ref={field}
          id="research-question-edit"
          autoFocus
          value={value}
          readOnly={pending}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "research-question-edit-error" : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            if (failure === "invalid" || failure === "too_long") setFailure(null)
          }}
        />
        <div className="flex justify-between gap-4">
          {fieldError ? <FieldError id="research-question-edit-error">{fieldError}</FieldError> : <span />}
          <FieldCount>{t("count", { count: length, max: RESEARCH_QUESTION_MAX_LENGTH })}</FieldCount>
        </div>
      </Field>
      <div className="flex max-w-[36ch] flex-col gap-2 sm:mt-7">
        <div className="flex items-center gap-4">
          <Button type="submit" aria-disabled={pending || undefined}>
            {pending ? t("saving") : t("save")}
          </Button>
          <Button type="button" variant="text" onClick={close}>
            {t("cancel")}
          </Button>
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
