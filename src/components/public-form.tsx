"use client"

import { useLocale, useTranslations } from "next-intl"
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { flushSync } from "react-dom"
import { cn } from "cn"
import { submitFeedback, type SubmitFeedbackResult } from "@/app/actions"
import { Avatar } from "@/components/logo"
import { Quote } from "@/components/quote"
import { Button } from "@/components/ui/button"
import { Field, FieldCount, FieldError, FieldHint, FieldLabel, FieldOptional } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import { FEEDBACK_MAX_LENGTH } from "@/lib/plans"

type Status = "writing" | "sent" | "unavailable"
type FormError = Exclude<Extract<SubmitFeedbackResult, { ok: false }>["reason"], "unavailable"> | "network"

// Most feedback is a few sentences: the count shows up only near the limit.
const COUNT_FROM = FEEDBACK_MAX_LENGTH * 0.8

// The page is opened on phones: side padding and the top of the page clear the notch and the rounded corners
// (the viewport of /f/* is `viewport-fit=cover`).
const SAFE_X = "pl-[max(--spacing(6),env(safe-area-inset-left))] pr-[max(--spacing(6),env(safe-area-inset-right))]"
const SAFE_TOP = "pt-[max(--spacing(6),env(safe-area-inset-top))]"
const SAFE_BOTTOM = "pb-[max(--spacing(8),env(safe-area-inset-bottom))]"
// A tap on a phone: no grey flash, no double-tap zoom delay.
const TOUCH = "touch-manipulation [-webkit-tap-highlight-color:transparent]"

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
  // The email is optional and most people skip it: it opens on request, under "Invia", so the button stays right
  // under the text and in sight when the phone keyboard is open.
  const [emailOpen, setEmailOpen] = useState(false)
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<Status>("writing")
  const [error, setError] = useState<FormError | null>(null)
  const [pending, startTransition] = useTransition()
  const textField = useRef<HTMLTextAreaElement>(null)
  const emailField = useRef<HTMLInputElement>(null)
  // After sending, the form is gone: the focus goes to the thank-you, so a screen reader reads it.
  const sentHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (status === "sent") sentHeading.current?.focus()
  }, [status])

  // The text field starts at 4 rows and grows with the text up to its max height, then scrolls inside.
  useLayoutEffect(() => {
    const field = textField.current
    if (!field) return
    field.style.height = "auto"
    field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`
  }, [text, status])

  if (status === "unavailable") return <FormUnavailable workspaceName={workspaceName} />

  if (status === "sent")
    return (
      <FormShell className="bg-highlight">
        <FormBrand name={workspaceName} className="mb-24" />
        {/* The confirmation arrives with a short rise, so the tap feels answered. */}
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 motion-safe:ease-out">
          <h1 ref={sentHeading} tabIndex={-1} className="mb-4 font-serif text-5xl leading-display font-medium tracking-snug outline-none">
            {t("sent.title")}
          </h1>
          <p className="mb-8 text-lg leading-normal text-on-highlight">
            {t("sent.text", { name: workspaceName })}
          </p>
          <Quote text={text.trim()} size="sm" bar maxLength={100} className="wrap-anywhere text-on-highlight" />
        </div>
        <Button
          size="lg"
          className="mt-auto w-full"
          onClick={() => {
            // Rendered now, inside the tap, so the focus lands in the empty field and the phone opens the keyboard.
            flushSync(() => {
              setText("")
              setError(null)
              setStatus("writing")
            })
            textField.current?.focus()
          }}
        >
          {t("sent.another")}
        </Button>
        <FormFoot className="mt-3 text-on-highlight">{t("sent.footer")}</FormFoot>
      </FormShell>
    )

  const compact = text.length > 0
  const showCount = error !== "invalid" && text.length >= COUNT_FROM

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !text.trim()) return
    setError(null)
    startTransition(async () => {
      // On the venue Wi-Fi the request can fail: the error stays on the form and the text stays in the field.
      const result = await submitFeedback({ slug, text, email: email.trim(), website }).catch(() => null)
      if (!result) setError("network")
      else if (result.ok) setStatus("sent")
      else if (result.reason === "unavailable") setStatus("unavailable")
      else setError(result.reason)
    })
  }

  return (
    <main className={cn("flex min-h-dvh flex-col", TOUCH)}>
      <div className={cn("bg-highlight", SAFE_X, SAFE_TOP, compact ? "pb-4" : "pb-8")}>
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
        className={cn("mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 pt-6", SAFE_X, SAFE_BOTTOM)}
      >
        <Field>
          <FieldLabel htmlFor="text">{t("feedbackLabel")}</FieldLabel>
          <Textarea
            ref={textField}
            id="text"
            variant="line"
            rows={4}
            // Grows a little with the text, then scrolls inside: "Invia" stays close under it.
            className="max-h-48"
            maxLength={FEEDBACK_MAX_LENGTH}
            placeholder={t("feedbackPlaceholder")}
            // A sentence, as said out loud: capital first letter, the keyboard's own suggestions, no red underline
            // under every Italian word when the keyboard is set to another language. Return starts a new line.
            autoCapitalize="sentences"
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={error === "invalid" || undefined}
            aria-describedby={error === "invalid" ? "text-error" : showCount ? "text-count" : undefined}
          />
          {error === "invalid" && <FieldError id="text-error">{t("feedbackError")}</FieldError>}
          {showCount && (
            <FieldCount id="text-count">
              {formatNumber(text.length, locale)} / {formatNumber(FEEDBACK_MAX_LENGTH, locale)}
            </FieldCount>
          )}
        </Field>
        {(error === "rate_limited" || error === "network") && (
          <FieldError role="alert" className="-mb-2 text-center">
            {t(error === "network" ? "networkError" : "rateLimited")}
          </FieldError>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full transition-transform active:scale-[0.98]"
          disabled={!text.trim() || pending}
        >
          {pending ? t("submitting") : t("submit")}
        </Button>
        {emailOpen ? (
          <Field>
            <FieldLabel htmlFor="email">
              {t("emailLabel")} <FieldOptional>{t("emailOptional")}</FieldOptional>
            </FieldLabel>
            <Input
              ref={emailField}
              id="email"
              type="email"
              variant="line"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              // The keyboard's return key reads "Invia" and sends, like the button.
              enterKeyHint="send"
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
        ) : (
          <Button
            type="button"
            variant="text"
            className="-my-2 min-h-11 self-center text-center whitespace-normal pointer-coarse:after:hidden"
            onClick={() => {
              // Rendered now, inside the tap, so the phone opens the keyboard on the email field.
              flushSync(() => setEmailOpen(true))
              emailField.current?.focus()
            }}
          >
            {t("emailOpen")}
          </Button>
        )}
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
        <FormFoot className="mt-auto">{t("footer")}</FormFoot>
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
    <main className={cn("flex min-h-dvh flex-col", SAFE_X, SAFE_TOP, SAFE_BOTTOM, TOUCH, className)}>
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
