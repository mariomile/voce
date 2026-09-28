"use client"

import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"
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
  const t = useTranslations("form")
  const locale = useLocale()
  const [text, setText] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<Status>("writing")
  const [error, setError] = useState<"invalid_email" | "invalid" | "rate_limited" | null>(null)
  const [pending, startTransition] = useTransition()
  // After sending, the form is gone: the focus goes to the thank-you, so a screen reader reads it.
  const sentHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (status === "sent") sentHeading.current?.focus()
  }, [status])

  if (status === "unavailable") return <FormUnavailable workspaceName={workspaceName} />

  if (status === "sent")
    return (
      <FormShell className="bg-highlight">
        <FormBrand name={workspaceName} className="mb-24" />
        <h1 ref={sentHeading} tabIndex={-1} className="mb-4 font-serif text-5xl leading-display font-medium tracking-snug outline-none">
          {t("sent.title")}
        </h1>
        <p className="mb-8 text-lg leading-normal text-on-highlight">
          {t("sent.text", { name: workspaceName })}
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
          {t("sent.another")}
        </Button>
        <FormFoot className="mt-3 text-on-highlight">{t("sent.footer")}</FormFoot>
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
    <main className="flex min-h-dvh flex-col">
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
          {!compact && <p className="text-base leading-normal text-on-highlight">{t("intro")}</p>}
        </div>
      </div>
      <form
        noValidate
        onSubmit={submit}
        className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-6 pt-6 pb-8"
      >
        <Field>
          <FieldLabel htmlFor="text">{t("feedbackLabel")}</FieldLabel>
          <Textarea
            id="text"
            variant="line"
            rows={6}
            maxLength={FEEDBACK_MAX_LENGTH}
            placeholder={t("feedbackPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={error === "invalid" || undefined}
            aria-describedby={error === "invalid" ? "text-error" : "text-count"}
          />
          {error === "invalid" ? (
            <FieldError id="text-error">{t("feedbackError")}</FieldError>
          ) : (
            <FieldCount id="text-count">
              {formatNumber(text.length, locale)} / {formatNumber(FEEDBACK_MAX_LENGTH, locale)}
            </FieldCount>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">
            {t("emailLabel")} <FieldOptional>{t("emailOptional")}</FieldOptional>
          </FieldLabel>
          <Input
            id="email"
            type="email"
            variant="line"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error === "invalid_email" || undefined}
            aria-describedby={error === "invalid_email" ? "email-error" : "email-hint"}
          />
          {error === "invalid_email" ? (
            <FieldError id="email-error">{t("emailError")}</FieldError>
          ) : (
            <FieldHint id="email-hint">{t("emailHint")}</FieldHint>
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
            {t("rateLimited")}
          </FieldError>
        )}
        <Button
          type="submit"
          size="lg"
          className={cn("w-full", error !== "rate_limited" && "mt-auto")}
          disabled={!text.trim() || pending}
        >
          {pending ? t("submitting") : t("submit")}
        </Button>
        <FormFoot className="-mt-2">{t("footer")}</FormFoot>
      </form>
    </main>
  )
}

export function FormUnavailable({ workspaceName }: { workspaceName: string }) {
  const t = useTranslations("form")
  return (
    <FormShell>
      <FormBrand name={workspaceName} className="mb-24" />
      <h1 className="mb-4 font-serif text-4xl leading-heading font-medium tracking-snug">
        {t("unavailable.title")}
      </h1>
      <p className="mb-8 text-lg leading-normal text-ink-muted">
        {t("unavailable.text", { name: workspaceName })}
      </p>
      <FormFoot className="mt-auto">{t("unavailable.footer")}</FormFoot>
    </FormShell>
  )
}

function FormShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <main className={cn("flex min-h-dvh flex-col px-6 pt-6 pb-8", className)}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">{children}</div>
    </main>
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
