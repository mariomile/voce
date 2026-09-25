"use client"

import { useState, useTransition } from "react"
import { cn } from "cn"
import { submitFeedback } from "@/app/actions"
import { Avatar } from "@/components/logo"
import { Quote } from "@/components/quote"
import { Button } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel, FieldOptional } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import { FEEDBACK_MAX_LENGTH } from "@/lib/plans"

type Status = "writing" | "sent" | "unavailable"

// Kit: .form-page, .form-ask, .form-body, .form-message
export function PublicForm({
  slug,
  workspaceName,
  question,
}: {
  slug: string
  workspaceName: string
  question: string
}) {
  const [text, setText] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<Status>("writing")
  const [error, setError] = useState<"invalid_email" | "invalid" | "rate_limited" | null>(null)
  const [pending, startTransition] = useTransition()

  if (status === "unavailable") return <FormUnavailable workspaceName={workspaceName} />

  if (status === "sent")
    return (
      <FormShell className="bg-highlight">
        <FormBrand name={workspaceName} className="mb-24" />
        <h1 className="mb-4 font-serif text-5xl leading-display font-medium tracking-snug">
          Ricevuto. Grazie.
        </h1>
        <p className="mb-8 text-lg leading-normal text-on-highlight">
          Il team di {workspaceName} lo legge insieme agli altri feedback e lo usa per decidere cosa
          migliorare.
        </p>
        <Quote text={text.trim()} size="sm" bar maxLength={100} className="text-on-highlight" />
        <Button
          size="lg"
          className="mt-auto w-full"
          onClick={() => {
            setText("")
            setStatus("writing")
          }}
        >
          Scrivi un altro feedback
        </Button>
        <FormFoot className="mt-3 text-on-highlight">Raccolto con Voce.</FormFoot>
      </FormShell>
    )

  const compact = text.length > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitFeedback({ slug, text, email: email.trim(), website })
      if (result.ok) setStatus("sent")
      else if (result.reason === "unavailable") setStatus("unavailable")
      else setError(result.reason)
    })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className={cn("bg-highlight px-6 pt-6", compact ? "pb-4" : "pb-8")}>
        <div className="mx-auto w-full max-w-lg">
          <FormBrand name={workspaceName} className={compact ? "mb-3" : "mb-8"} />
          <h1
            className={cn(
              "font-serif leading-heading font-medium tracking-snug wrap-anywhere",
              compact ? "text-3xl" : "mb-2 text-4xl"
            )}
          >
            {question}
          </h1>
          {!compact && (
            <p className="text-base leading-normal text-on-highlight">
              Un problema, un&apos;idea, qualcosa che ti piace. Lo leggono le persone che costruiscono
              il prodotto.
            </p>
          )}
        </div>
      </div>
      <form
        noValidate
        onSubmit={submit}
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-6 pt-6 pb-8"
      >
        <Field>
          <FieldLabel htmlFor="text">Il tuo feedback</FieldLabel>
          <Textarea
            id="text"
            variant="line"
            rows={6}
            maxLength={FEEDBACK_MAX_LENGTH}
            placeholder="Scrivi come lo diresti a voce"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={error === "invalid" || undefined}
            aria-describedby={error === "invalid" ? "text-error" : "text-count"}
          />
          {error === "invalid" ? (
            <FieldError id="text-error">
              Non siamo riusciti a inviarlo. Controlla il testo e riprova.
            </FieldError>
          ) : (
            <FieldCount id="text-count">
              {formatNumber(text.length)} / {formatNumber(FEEDBACK_MAX_LENGTH)}
            </FieldCount>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">
            Email <FieldOptional>facoltativa</FieldOptional>
          </FieldLabel>
          <Input
            id="email"
            type="email"
            variant="line"
            autoComplete="email"
            placeholder="nome@esempio.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error === "invalid_email" || undefined}
            aria-describedby={error === "invalid_email" ? "email-error" : "email-hint"}
          />
          {error === "invalid_email" ? (
            <FieldError id="email-error">
              Questa email sembra incompleta. Correggila o lasciala vuota.
            </FieldError>
          ) : (
            <FieldHint id="email-hint">Lasciala solo se vuoi essere ricontattato.</FieldHint>
          )}
        </Field>
        {/* Anti-bot: hidden from people and screen readers (the hidden attribute covers both), bots fill it in. */}
        <div hidden>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        {error === "rate_limited" && (
          <FieldError role="alert" className="mt-auto text-center">
            Troppi invii in poco tempo. Riprova più tardi.
          </FieldError>
        )}
        <Button
          type="submit"
          size="lg"
          className={cn("w-full", error !== "rate_limited" && "mt-auto")}
          disabled={!text.trim() || pending}
        >
          {pending ? "Invio…" : "Invia"}
        </Button>
        <FormFoot className="-mt-2">Raccolto con Voce. Non serve un account.</FormFoot>
      </form>
    </div>
  )
}

export function FormUnavailable({ workspaceName }: { workspaceName: string }) {
  return (
    <FormShell>
      <FormBrand name={workspaceName} className="mb-24" />
      <h1 className="mb-4 font-serif text-4xl leading-heading font-medium tracking-snug">
        Per ora questo modulo non accetta nuovi feedback.
      </h1>
      <p className="mb-8 text-lg leading-normal text-ink-muted">
        Se vuoi scrivere a {workspaceName}, usa il supporto dall&apos;app o dal sito. Il tuo messaggio
        arriva comunque alle stesse persone.
      </p>
      <FormFoot className="mt-auto">Raccolto con Voce.</FormFoot>
    </FormShell>
  )
}

function FormShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-h-dvh flex-col px-6 pt-6 pb-8", className)}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">{children}</div>
    </div>
  )
}

function FormBrand({ name, className }: { name: string; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-base font-bold", className)}>
      <Avatar name={name} />
      {name}
    </p>
  )
}

function FormFoot({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-center text-xs text-ink-subtle", className)}>{children}</p>
}
