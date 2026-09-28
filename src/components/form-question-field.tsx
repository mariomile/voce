"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { setFormQuestion } from "@/app/(app)/research/[id]/collect/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldCount, FieldHint, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FORM_QUESTION_MAX_LENGTH } from "@/lib/plans"

export function FormQuestionField({
  researchId,
  question,
  defaultQuestion,
}: {
  researchId: string
  question: string | null
  defaultQuestion: string
}) {
  const t = useTranslations("collect.formQuestion")
  const [value, setValue] = useState(question ?? "")
  const [saved, setSaved] = useState(question ?? "")
  const [message, setMessage] = useState<"saved" | "failed" | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await setFormQuestion(researchId, value)
      if (result.ok) {
        setValue(value.trim())
        setSaved(value.trim())
      }
      setMessage(result.ok ? "saved" : "failed")
    })
  }

  return (
    <form noValidate onSubmit={submit} className="mt-8 flex max-w-[720px] flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="form-question">{t("label")}</FieldLabel>
        <Input
          id="form-question"
          maxLength={FORM_QUESTION_MAX_LENGTH}
          placeholder={defaultQuestion}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setMessage(null)
          }}
        />
        <div className="flex justify-between gap-4">
          <FieldHint>{t("hint", { question: defaultQuestion })}</FieldHint>
          <FieldCount>
            {value.length} / {FORM_QUESTION_MAX_LENGTH}
          </FieldCount>
        </div>
      </Field>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="secondary" disabled={pending || value.trim() === saved}>
          {pending ? t("saving") : t("save")}
        </Button>
        <p role="status" className="text-base text-ink-muted">
          {message === "saved" && t("saved")}
          {message === "failed" && <span className="text-problem">{t("failed")}</span>}
        </p>
      </div>
    </form>
  )
}
