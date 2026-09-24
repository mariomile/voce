"use client"

import { useState, useTransition } from "react"
import { addFeedback, type ManualFeedbackField } from "@/app/(app)/collect/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldLabel, FieldOptional } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import { CHANNEL_MAX_LENGTH, CUSTOMER_MAX_LENGTH, FEEDBACK_MAX_LENGTH } from "@/lib/plans"

const ERRORS: Record<ManualFeedbackField, string> = {
  text: `Scrivi il testo del feedback, al massimo ${formatNumber(FEEDBACK_MAX_LENGTH)} caratteri.`,
  channel: `Scrivi da dove arriva, al massimo ${CHANNEL_MAX_LENGTH} caratteri.`,
  customer: `Al massimo ${CUSTOMER_MAX_LENGTH} caratteri.`,
  receivedAt: "Scegli una data di oggi o del passato.",
}

export function ManualFeedbackForm({ channels, today }: { channels: string[]; today: string }) {
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
      const result = await addFeedback({ text, channel, customer, receivedAt })
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
      <p className="text-base text-ink-muted">
        Copiato da un&apos;email, da Slack o dalle tue note, uno alla volta.
      </p>
      <Field>
        <FieldLabel htmlFor="manual-text">Feedback</FieldLabel>
        <Textarea
          id="manual-text"
          rows={5}
          maxLength={FEEDBACK_MAX_LENGTH}
          placeholder="Le parole del cliente, così come le ha scritte"
          value={text}
          onChange={(e) => setText(e.target.value)}
          {...errorProps("text")}
        />
        {error("text") ?? (
          <FieldCount>
            {formatNumber(text.length)} / {formatNumber(FEEDBACK_MAX_LENGTH)}
          </FieldCount>
        )}
      </Field>
      <div className="grid grid-cols-3 gap-5">
        <Field>
          <FieldLabel htmlFor="manual-channel">Canale</FieldLabel>
          <Input
            id="manual-channel"
            list="manual-channels"
            maxLength={CHANNEL_MAX_LENGTH}
            placeholder="Supporto, Slack…"
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
            Cliente <FieldOptional>facoltativo</FieldOptional>
          </FieldLabel>
          <Input
            id="manual-customer"
            maxLength={CUSTOMER_MAX_LENGTH}
            placeholder="Nome o azienda"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            {...errorProps("customer")}
          />
          {error("customer")}
        </Field>
        <Field>
          <FieldLabel htmlFor="manual-date">
            Data <FieldOptional>se vuota, oggi</FieldOptional>
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
          {pending ? "Aggiungo…" : "Aggiungi il feedback"}
        </Button>
        <p role="status" className="text-base text-ink-muted">
          {message === "added" && "Aggiunto. Lo trovi tra i feedback."}
          {message === "limit" && (
            <span className="text-problem">
              Hai raggiunto il limite del piano Free: questo feedback non è stato salvato.
            </span>
          )}
        </p>
      </div>
    </form>
  )
}
