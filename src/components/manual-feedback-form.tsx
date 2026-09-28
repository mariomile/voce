"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"
import { addNotes, type AddNotesResult, type NotesField } from "@/app/(app)/research/[id]/collect/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel, FieldOptional } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import { CHANNEL_MAX_LENGTH, CUSTOMER_MAX_LENGTH, NOTES_MAX_LENGTH } from "@/lib/plans"

type Failure = Extract<AddNotesResult, { ok: false }>

// The notes of one interview, pasted into this Research: one person, one feedback. The channel starts
// as "Intervista"; changing it serves a message copied from an email or Slack. After a field error the
// focus goes back to that field; the text always stays.
export function ManualFeedbackForm({ researchId, channels, today }: { researchId: string; channels: string[]; today: string }) {
  const t = useTranslations("research.notes")
  const locale = useLocale()
  const textRef = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<HTMLInputElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [channel, setChannel] = useState(t("defaultChannel"))
  const [customer, setCustomer] = useState("")
  const [receivedAt, setReceivedAt] = useState("")
  const [failure, setFailure] = useState<Failure | null>(null)
  const [added, setAdded] = useState(false)
  const [pending, startTransition] = useTransition()

  // Which field each failure belongs to, and what it says there.
  const fieldErrors: Partial<Record<NotesField, string>> = {}
  if (failure?.reason === "invalid") {
    for (const field of failure.fields) {
      fieldErrors[field] = {
        text: t("errors.empty"),
        channel: t("errors.channel", { limit: CHANNEL_MAX_LENGTH }),
        customer: t("errors.customer", { limit: CUSTOMER_MAX_LENGTH }),
        receivedAt: t("errors.futureDate"),
      }[field]
    }
  }
  if (failure?.reason === "too_long") fieldErrors.text = t("errors.tooLong")
  if (failure?.reason === "future_date") fieldErrors.receivedAt = t("errors.futureDate")

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    setFailure(null)
    setAdded(false)
    startTransition(async () => {
      const result = await addNotes(researchId, { text, channel, customer, receivedAt })
      if (result.ok) {
        // Channel and date usually stay the same for the next interview.
        setText("")
        setCustomer("")
        setAdded(true)
        return
      }
      setFailure(result)
      const field =
        result.reason === "invalid" ? result.fields[0] : result.reason === "too_long" ? "text" : result.reason === "future_date" ? "receivedAt" : null
      const ref = { text: textRef, channel: channelRef, customer: customerRef, receivedAt: dateRef }
      if (field) ref[field].current?.focus()
    })
  }

  const errorProps = (field: NotesField) =>
    fieldErrors[field] ? { "aria-invalid": true, "aria-describedby": `notes-${field}-error` } : {}
  const error = (field: NotesField) =>
    fieldErrors[field] ? <FieldError id={`notes-${field}-error`}>{fieldErrors[field]}</FieldError> : null

  return (
    <form noValidate onSubmit={submit} className="flex max-w-[720px] flex-col gap-5">
      <p className="text-base text-ink-muted">{t("lede")}</p>
      <Field>
        <FieldLabel htmlFor="notes-text">{t("textLabel")}</FieldLabel>
        <Textarea
          ref={textRef}
          id="notes-text"
          rows={8}
          placeholder={t("textPlaceholder")}
          value={text}
          readOnly={pending}
          onChange={(e) => setText(e.target.value)}
          aria-describedby={fieldErrors.text ? undefined : "notes-text-hint"}
          {...errorProps("text")}
        />
        <div className="flex justify-between gap-4">
          {error("text") ?? <FieldHint id="notes-text-hint">{t("emptyHint")}</FieldHint>}
          <FieldCount>
            {t("count", { count: formatNumber([...text].length, locale), max: formatNumber(NOTES_MAX_LENGTH, locale) })}
          </FieldCount>
        </div>
      </Field>
      <div className="grid grid-cols-3 gap-5">
        <Field>
          <FieldLabel htmlFor="notes-channel">{t("channelLabel")}</FieldLabel>
          <Input
            ref={channelRef}
            id="notes-channel"
            list="notes-channels"
            maxLength={CHANNEL_MAX_LENGTH}
            value={channel}
            readOnly={pending}
            onChange={(e) => setChannel(e.target.value)}
            {...errorProps("channel")}
          />
          <datalist id="notes-channels">
            {channels.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {error("channel")}
        </Field>
        <Field>
          <FieldLabel htmlFor="notes-customer">
            {t("customerLabel")} <FieldOptional>{t("customerOptional")}</FieldOptional>
          </FieldLabel>
          <Input
            ref={customerRef}
            id="notes-customer"
            maxLength={CUSTOMER_MAX_LENGTH}
            placeholder={t("customerPlaceholder")}
            value={customer}
            readOnly={pending}
            onChange={(e) => setCustomer(e.target.value)}
            {...errorProps("customer")}
          />
          {error("customer")}
        </Field>
        <Field>
          <FieldLabel htmlFor="notes-date">
            {t("dateLabel")} <FieldOptional>{t("dateOptional")}</FieldOptional>
          </FieldLabel>
          <Input
            ref={dateRef}
            id="notes-date"
            type="date"
            max={today}
            value={receivedAt}
            readOnly={pending}
            onChange={(e) => setReceivedAt(e.target.value)}
            {...errorProps("receivedAt")}
          />
          {error("receivedAt")}
        </Field>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" aria-disabled={pending || undefined}>
          {pending ? t("submitting") : t("submit")}
        </Button>
        <p role="status" className="text-base text-ink-muted">
          {added && t("added")}
          {failure?.reason === "limit" && <span className="text-problem">{t("errors.limit")}</span>}
          {failure?.reason === "session" && (
            <span className="text-problem">
              {t("errors.session")}{" "}
              <Link href="/login" className={buttonVariants({ variant: "link" })}>
                {t("errors.sessionLink")}
              </Link>
            </span>
          )}
        </p>
      </div>
    </form>
  )
}
