"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { addFeedback, type ManualFeedbackField } from "@/app/(app)/research/[id]/collect/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldLabel, FieldOptional } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import { CHANNEL_MAX_LENGTH, CUSTOMER_MAX_LENGTH, FEEDBACK_MAX_LENGTH } from "@/lib/plans"

export function ManualFeedbackForm({ researchId, channels, today }: { researchId: string; channels: string[]; today: string }) {
  const t = useTranslations("collect.manualForm")
  const locale = useLocale()
  const ERRORS: Record<ManualFeedbackField, string> = {
    text: t("errors.text", { limit: formatNumber(FEEDBACK_MAX_LENGTH, locale) }),
    channel: t("errors.channel", { limit: CHANNEL_MAX_LENGTH }),
    customer: t("errors.customer", { limit: CUSTOMER_MAX_LENGTH }),
    receivedAt: t("errors.receivedAt"),
  }
  const [text, setText] = useState("")
  const [channel, setChannel] = useState("")
  const [customer, setCustomer] = useState("")
  const [receivedAt, setReceivedAt] = useState("")
  const [invalid, setInvalid] = useState<ManualFeedbackField[]>([])
  const [message, setMessage] = useState<"added" | "limit" | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await addFeedback(researchId, { text, channel, customer, receivedAt })
      if (result.ok) {
        // Channel and date usually stay the same for the next one.
        setText("")
        setCustomer("")
        setInvalid([])
        setMessage("added")
      } else if (result.reason === "limit") setMessage("limit")
      else setInvalid(result.fields)
    })
  }

  const error = (field: ManualFeedbackField) =>
    invalid.includes(field) ? (
      <FieldError id={`${field}-error`}>{ERRORS[field]}</FieldError>
    ) : null
  const errorProps = (field: ManualFeedbackField) =>
    invalid.includes(field) ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {}

  return (
    <form noValidate onSubmit={submit} className="flex max-w-[720px] flex-col gap-5">
      <p className="text-base text-ink-muted">{t("intro")}</p>
      <Field>
        <FieldLabel htmlFor="manual-text">{t("feedbackLabel")}</FieldLabel>
        <Textarea
          id="manual-text"
          rows={5}
          maxLength={FEEDBACK_MAX_LENGTH}
          placeholder={t("feedbackPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          {...errorProps("text")}
        />
        {error("text") ?? (
          <FieldCount>
            {formatNumber(text.length, locale)} / {formatNumber(FEEDBACK_MAX_LENGTH, locale)}
          </FieldCount>
        )}
      </Field>
      <div className="grid grid-cols-3 gap-5">
        <Field>
          <FieldLabel htmlFor="manual-channel">{t("channelLabel")}</FieldLabel>
          <Input
            id="manual-channel"
            list="manual-channels"
            maxLength={CHANNEL_MAX_LENGTH}
            placeholder={t("channelPlaceholder")}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            {...errorProps("channel")}
          />
          <datalist id="manual-channels">
            {channels.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {error("channel")}
        </Field>
        <Field>
          <FieldLabel htmlFor="manual-customer">
            {t("customerLabel")} <FieldOptional>{t("customerOptional")}</FieldOptional>
          </FieldLabel>
          <Input
            id="manual-customer"
            maxLength={CUSTOMER_MAX_LENGTH}
            placeholder={t("customerPlaceholder")}
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            {...errorProps("customer")}
          />
          {error("customer")}
        </Field>
        <Field>
          <FieldLabel htmlFor="manual-date">
            {t("dateLabel")} <FieldOptional>{t("dateOptional")}</FieldOptional>
          </FieldLabel>
          <Input
            id="manual-date"
            type="date"
            max={today}
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
            {...errorProps("receivedAt")}
          />
          {error("receivedAt")}
        </Field>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={!text.trim() || !channel.trim() || pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
        <p role="status" className="text-base text-ink-muted">
          {message === "added" && t("added")}
          {message === "limit" && <span className="text-problem">{t("limitReached")}</span>}
        </p>
      </div>
    </form>
  )
}
