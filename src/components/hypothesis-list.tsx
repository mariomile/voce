"use client"

import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import {
  addHypothesis,
  deleteHypothesis,
  synthesize,
  updateHypothesis,
  type HypothesisResult,
  type SynthesizeResult,
} from "@/app/(app)/research/[id]/actions"
import { failureMessage, verdictsMessage } from "@/components/analyze-button"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldHint, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Quote } from "@/components/quote"
import { useVerdictFailure } from "@/components/synthesis-outcome"
import type { Locale } from "@/i18n/locale"
import type { Hypothesis, Quote as VerdictQuote, Verdict } from "@/lib/data"
import { formatDate } from "@/lib/format"
import { MAX_HYPOTHESES } from "@/lib/plans"

type Failure = Extract<HypothesisResult, { ok: false }>["reason"]
type T = ReturnType<typeof useTranslations<"research.hypotheses">>

// A browser that cannot reach the server reads the same as a save that did not go through (H4).
const unreachable = { ok: false as const, reason: "failed" as const }

// The Ipotesi section of the Sintesi: up to 5 sentences of the PM, each with Modifica and Elimina
// (confirmed in the row), then the field for a new one. Empty, it is one line and a secondary button,
// in the same place, so the page does not move when the first hypothesis is written. The text of a
// hypothesis is the PM's and shows as text; so does the reasoning of its verdict.
// verdictOnly, in a Sintesi with feedback: what "Solo il verdetto" needs. feedbackSinceThemes: the feedback
// that entered Voce after the last done themes analysis, null without one. note: its cost; limitNote: why
// it is off, with the month's analyses used up.
type VerdictOnly = { feedbackSinceThemes: number | null; note: string; limitNote?: string }

export function HypothesisList({
  researchId,
  hypotheses,
  verdictOnly,
}: {
  researchId: string
  hypotheses: Hypothesis[]
  verdictOnly?: VerdictOnly
}) {
  const t = useTranslations("research.hypotheses")
  const tAnalyze = useTranslations("research.synthesis.analyze")
  const { failed: verdictFailed } = useVerdictFailure()
  const heading = useRef<HTMLHeadingElement>(null)
  const write = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  // Annulla on the first field gives the focus back to "Scrivi un'ipotesi", once it is back on the page.
  const focusWrite = useRef(false)
  const full = hypotheses.length >= MAX_HYPOTHESES
  const canVerdictOnly = Boolean(verdictOnly && showVerdictOnly(hypotheses, verdictOnly))

  useEffect(() => {
    if (open || !focusWrite.current) return
    focusWrite.current = false
    write.current?.focus()
  }, [open])

  return (
    <section aria-labelledby="hypotheses-title" className="mb-14">
      <h2 id="hypotheses-title" ref={heading} tabIndex={-1} className="mb-2 text-xl font-bold outline-none">
        {t("title")}
      </h2>

      {hypotheses.length > 0 && (
        <ul>
          {hypotheses.map((h) => (
            <HypothesisRow
              key={h.id}
              hypothesis={h}
              t={t}
              onDeleted={() => {
                setAnnouncement("")
                heading.current?.focus()
              }}
            />
          ))}
        </ul>
      )}

      {hypotheses.length === 0 && !open && (
        <div className="flex items-center justify-between gap-8 border-t border-line py-4">
          <p className="max-w-[64ch] text-base text-ink-muted">{t("emptyText")}</p>
          <Button ref={write} variant="secondary" onClick={() => setOpen(true)}>
            {t("write")}
          </Button>
        </div>
      )}

      {(hypotheses.length > 0 || open) &&
        (full ? (
          <p className="border-t border-line pt-4 text-base text-ink-muted">{t("maxReached")}</p>
        ) : (
          <NewHypothesis
            researchId={researchId}
            t={t}
            autoFocus={hypotheses.length === 0}
            onCancel={
              hypotheses.length === 0
                ? () => {
                    focusWrite.current = true
                    setOpen(false)
                  }
                : undefined
            }
            onAdded={(last) => {
              setAnnouncement(t("added"))
              // The fifth one: the field gives way to H3, the focus goes to the section title.
              if (last) heading.current?.focus()
            }}
            onChange={() => setAnnouncement("")}
            last={hypotheses.length + 1 >= MAX_HYPOTHESES}
          />
        ))}
      {canVerdictOnly && verdictOnly && (
        <VerdictOnlyButton
          researchId={researchId}
          count={hypotheses.length}
          {...verdictOnly}
          onDone={(text) => {
            // The button goes away once every verdict is up to date: the result is announced by the
            // section, and the focus goes to its title.
            setAnnouncement(text)
            heading.current?.focus()
          }}
        />
      )}
      <p role="status" className="mt-2 text-sm text-ink-muted empty:hidden">
        {announcement}
      </p>
      {/* S6: the verdict of the last click failed; the verdicts above are the previous ones. It points to
          "Solo il verdetto" only when the button is there; otherwise the next analysis redoes the verdict. */}
      <p role="status" className="mt-2 max-w-[64ch] text-sm text-problem empty:hidden">
        {verdictFailed && tAnalyze(canVerdictOnly ? "verdictFailed" : "verdictFailedNextAnalysis")}
      </p>
    </section>
  )
}

// "Solo il verdetto" is for the PM who read the themes and wrote a hypothesis: some hypothesis has no verdict,
// or feedback arrived after its verdict, while nothing arrived after the last themes analysis (else the whole
// analysis is due).
function showVerdictOnly(hypotheses: Hypothesis[], { feedbackSinceThemes }: VerdictOnly) {
  if (feedbackSinceThemes !== 0) return false
  return hypotheses.some((h) => !h.verdict || h.verdict.arrivedAfterVerdict > 0)
}

// The verdict of every hypothesis again, 1 analysis. The section announces the result; a failed verdict is S6,
// shown by the section; the other failures stay here.
function VerdictOnlyButton({
  researchId,
  count,
  note,
  limitNote,
  onDone,
}: VerdictOnly & { researchId: string; count: number; onDone: (announcement: string) => void }) {
  const t = useTranslations("research.hypotheses.verdictOnly")
  const tAnalyze = useTranslations("research.synthesis.analyze")
  const tFailures = useTranslations("themes.analyzeButton.failures")
  const verdictFailure = useVerdictFailure()
  const [outcome, setOutcome] = useState<SynthesizeResult | { ok: false; reason: "network" } | null>(null)
  const [pending, startTransition] = useTransition()

  function run() {
    if (pending || limitNote) return
    setOutcome(null)
    verdictFailure.setFailed(false)
    startTransition(async () => {
      const result = await synthesize(researchId, "verdict").catch(() => ({ ok: false as const, reason: "network" as const }))
      setOutcome(result)
      if (result.ok) onDone(verdictsMessage(tAnalyze, result.verdicts))
      if (!result.ok && result.reason === "failed") verdictFailure.setFailed(true)
    })
  }

  // Done: the section announces it. failed: S6, in the section.
  const failure = outcome && !outcome.ok && outcome.reason !== "failed" ? outcome.reason : null
  let status: React.ReactNode = null
  if (failure === "network") status = <span className="text-problem">{tAnalyze("network")}</span>
  else if (failure === "session")
    status = (
      <span className="text-problem">
        {failureMessage(tFailures, failure)}{" "}
        <Link href="/login" className={buttonVariants({ variant: "link", className: "text-sm" })}>
          {tAnalyze("sessionLink")}
        </Link>
      </span>
    )
  else if (failure) status = <span className="text-problem">{failureMessage(tFailures, failure)}</span>

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <Button variant="secondary" onClick={run} aria-disabled={pending || Boolean(limitNote) || undefined}>
        {pending ? t("running") : t("label", { count })}
      </Button>
      {!pending && <p className="text-sm text-ink-muted">{limitNote ?? note}</p>}
      <p role="status" className="text-sm text-ink-muted empty:hidden">
        {status}
      </p>
    </div>
  )
}

function NewHypothesis({
  researchId,
  t,
  autoFocus,
  last,
  onCancel,
  onAdded,
  onChange,
}: {
  researchId: string
  t: T
  autoFocus: boolean
  last: boolean
  onCancel?: () => void
  onAdded: (last: boolean) => void
  onChange: () => void
}) {
  const field = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [failure, setFailure] = useState<Failure | null>(null)
  const [pending, startTransition] = useTransition()
  const fieldError = failure === "invalid" ? t("errors.empty") : failure === "too_long" ? t("errors.tooLong") : null

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    setFailure(null)
    startTransition(async () => {
      const result = await addHypothesis(researchId, text).catch(() => unreachable)
      if (result.ok) {
        setText("")
        onAdded(last)
        if (!last) field.current?.focus()
        return
      }
      setFailure(result.reason)
      if (result.reason === "invalid" || result.reason === "too_long") field.current?.focus()
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex items-start gap-4 border-t border-line pt-4">
      <Field className="flex-1">
        <FieldLabel htmlFor="new-hypothesis">{t("label")}</FieldLabel>
        <Input
          ref={field}
          id="new-hypothesis"
          autoFocus={autoFocus}
          value={text}
          readOnly={pending}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "new-hypothesis-error" : "new-hypothesis-hint"}
          onChange={(event) => {
            setText(event.target.value)
            onChange()
            if (failure === "invalid" || failure === "too_long") setFailure(null)
          }}
        />
        {fieldError ? (
          <FieldError id="new-hypothesis-error">{fieldError}</FieldError>
        ) : (
          <FieldHint id="new-hypothesis-hint">{t("hint")}</FieldHint>
        )}
      </Field>
      <div className="mt-7 flex max-w-[36ch] flex-col gap-2">
        <div className="flex items-center gap-4">
          <Button type="submit" variant="secondary" aria-disabled={pending || undefined}>
            {pending ? t("adding") : t("add")}
          </Button>
          {onCancel && (
            <Button type="button" variant="link" onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
        </div>
        <FailureNote failure={failure} t={t} message={t("errors.failed")} />
      </div>
    </form>
  )
}

function HypothesisRow({ hypothesis, t, onDeleted }: { hypothesis: Hypothesis; t: T; onDeleted: () => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view")
  // Where the focus goes back when an edit or a confirmation closes: the button that opened it.
  const returnTo = useRef<"edit" | "delete" | null>(null)
  const edit = useRef<HTMLButtonElement>(null)
  const remove = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (mode !== "view" || !returnTo.current) return
    ;(returnTo.current === "edit" ? edit : remove).current?.focus()
    returnTo.current = null
  }, [mode])

  function close(to: "edit" | "delete") {
    returnTo.current = to
    setMode("view")
  }

  return (
    <li className="grid grid-cols-[148px_1fr] gap-6 border-t border-line py-5">
      {/* The column of the verdict, as wide as the number column of the themes. */}
      <div>{hypothesis.verdict && <VerdictWord verdict={hypothesis.verdict} />}</div>
      <div>
        {mode === "edit" ? (
          <EditHypothesis hypothesis={hypothesis} t={t} onClose={() => close("edit")} />
        ) : (
          <>
            <h3 className="max-w-[64ch] text-lg leading-snug font-semibold">{hypothesis.text}</h3>
            {hypothesis.verdict ? (
              <VerdictDetail verdict={hypothesis.verdict} writtenAt={hypothesis.writtenAt} />
            ) : (
              <p className="mt-1 text-base text-ink-muted">{t("noVerdict")}</p>
            )}
            {mode === "confirm" ? (
              <ConfirmDelete hypothesis={hypothesis} t={t} onCancel={() => close("delete")} onDeleted={onDeleted} />
            ) : (
              <div className="mt-3 flex gap-6">
                <Button
                  ref={edit}
                  variant="link"
                  aria-label={t("editName", { text: hypothesis.text })}
                  onClick={() => setMode("edit")}
                >
                  {t("edit")}
                </Button>
                <Button
                  ref={remove}
                  variant="link"
                  aria-label={t("deleteName", { text: hypothesis.text })}
                  onClick={() => setMode("confirm")}
                >
                  {t("delete")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  )
}

// The text becomes a field with Salva and Annulla. With a verdict, H5 says first that a new text removes it.
// Esc is Annulla; the focus goes back to Modifica either way.
function EditHypothesis({ hypothesis, t, onClose }: { hypothesis: Hypothesis; t: T; onClose: () => void }) {
  const field = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(hypothesis.text)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [pending, startTransition] = useTransition()
  const fieldError = failure === "invalid" ? t("errors.empty") : failure === "too_long" ? t("errors.tooLong") : null
  const id = `hypothesis-${hypothesis.id}`
  const describedBy = [hypothesis.verdict && `${id}-warning`, fieldError && `${id}-error`].filter(Boolean).join(" ")

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    setFailure(null)
    startTransition(async () => {
      const result = await updateHypothesis(hypothesis.id, text).catch(() => unreachable)
      if (result.ok) return onClose()
      setFailure(result.reason)
      if (result.reason === "invalid" || result.reason === "too_long") field.current?.focus()
    })
  }

  return (
    <form noValidate onSubmit={submit}>
      {hypothesis.verdict && (
        <p id={`${id}-warning`} className="mb-2 max-w-[64ch] text-base text-ink-muted">
          {t("editWarning")}
        </p>
      )}
      <div className="flex items-start gap-4">
        <Field className="flex-1">
          <Input
            ref={field}
            autoFocus
            aria-label={t("editLabel")}
            value={text}
            readOnly={pending}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(event) => {
              setText(event.target.value)
              if (failure === "invalid" || failure === "too_long") setFailure(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !pending) onClose()
            }}
          />
          {fieldError && <FieldError id={`${id}-error`}>{fieldError}</FieldError>}
        </Field>
        <div className="flex max-w-[36ch] flex-col gap-2">
          <div className="flex items-center gap-4">
            <Button type="submit" variant="secondary" aria-disabled={pending || undefined}>
              {pending ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="link" onClick={() => !pending && onClose()}>
              {t("cancel")}
            </Button>
          </div>
          <FailureNote failure={failure} t={t} message={t("errors.failed")} />
        </div>
      </div>
    </form>
  )
}

// A verdict without any verified link has nothing to show but that: "Da rivedere", whatever the model said.
const hasLinks = (verdict: Verdict) => verdict.supporting + verdict.contradicting > 0

// The word carries the meaning; the sign is decorative. Both in ink: the colors belong to the kinds of theme.
const WORDS = {
  confirmed: { sign: "✓", key: "confirmed" },
  refuted: { sign: "✕", key: "refuted" },
  to_review: { sign: "?", key: "toReview" },
} as const

function VerdictWord({ verdict }: { verdict: Verdict }) {
  const t = useTranslations("research.verdict")
  const word = WORDS[hasLinks(verdict) ? verdict.verdict : "to_review"]
  return (
    <>
      <p className="text-2xl leading-tight font-bold">
        <span aria-hidden="true">{word.sign}</span> {t(word.key)}
      </p>
      {hasLinks(verdict) && (
        <p className="mt-1 text-[13px] text-ink-muted">
          {t("counts", { supporting: verdict.supporting, contradicting: verdict.contradicting, read: verdict.feedbackRead })}
        </p>
      )}
    </>
  )
}

// The reasoning of Voce (muted, as text), the verified quotes for and against with channel and date, and
// how many of the feedback read arrived after the hypothesis, and after the verdict.
function VerdictDetail({ verdict, writtenAt }: { verdict: Verdict; writtenAt: string }) {
  const t = useTranslations("research.verdict")
  const locale = useLocale() as Locale
  const date = formatDate(writtenAt, locale)
  return (
    <div className="mt-1 max-w-[64ch] text-base text-ink-muted">
      <p>{hasLinks(verdict) ? verdict.reasoning : t("noEvidence", { read: verdict.feedbackRead })}</p>
      <VerdictQuotes title={t("inFavour")} quotes={verdict.quotesFor} locale={locale} />
      <VerdictQuotes title={t("against")} quotes={verdict.quotesAgainst} locale={locale} />
      <p className="mt-3">
        {verdict.arrivedAfter > 0
          ? t("writtenAfter", { date, read: verdict.feedbackRead, count: verdict.arrivedAfter })
          : t("writtenBefore", { date, read: verdict.feedbackRead })}
      </p>
      {verdict.arrivedAfterVerdict > 0 && <p>{t("arrivedAfterVerdict", { count: verdict.arrivedAfterVerdict })}</p>}
    </div>
  )
}

function VerdictQuotes({ title, quotes, locale }: { title: string; quotes: VerdictQuote[]; locale: Locale }) {
  if (quotes.length === 0) return null
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {quotes.map((q) => (
        <Quote
          key={q.feedbackId}
          text={q.text}
          highlight={q.highlight}
          size="sm"
          cite={`${q.channel}, ${formatDate(q.receivedAt, locale)}`}
          className="mt-2 text-ink"
        />
      ))}
    </div>
  )
}

// H6 in the row. The focus starts on Annulla, the choice that destroys nothing; Tab reaches the delete
// button, Esc cancels.
function ConfirmDelete({
  hypothesis,
  t,
  onCancel,
  onDeleted,
}: {
  hypothesis: Hypothesis
  t: T
  onCancel: () => void
  onDeleted: () => void
}) {
  const [failure, setFailure] = useState<"busy" | "failed" | "session" | null>(null)
  const [pending, startTransition] = useTransition()

  function confirm() {
    if (pending) return
    setFailure(null)
    startTransition(async () => {
      const result = await deleteHypothesis(hypothesis.id).catch(() => unreachable)
      if (result.ok) return onDeleted()
      setFailure(result.reason)
    })
  }

  return (
    <div
      className="mt-3"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) onCancel()
      }}
    >
      <p className="mb-2 text-base">{t("deleteConfirm")}</p>
      <div className="flex items-center gap-6">
        <Button variant="link" autoFocus onClick={() => !pending && onCancel()}>
          {t("cancel")}
        </Button>
        <Button variant="secondary" aria-disabled={pending || undefined} onClick={confirm}>
          {pending ? t("deleting") : t("deleteConfirmAction")}
        </Button>
      </div>
      <FailureNote failure={failure} t={t} message={t("errors.deleteFailed")} />
    </div>
  )
}

// What went wrong with a save or a delete. busy: an analysis of the Research is running (H7).
export function FailureNote({ failure, t, message }: { failure: Failure | null; t: T; message: string }) {
  return (
    <p role="status" className="text-sm empty:hidden">
      {failure === "failed" && <span className="text-problem">{message}</span>}
      {failure === "session" && (
        <span className="text-problem">
          {t("errors.session")}{" "}
          <Link href="/login" className={buttonVariants({ variant: "link", className: "text-sm" })}>
            {t("errors.sessionLink")}
          </Link>
        </span>
      )}
      {failure === "max_reached" && <span className="text-problem">{t("maxReached")}</span>}
      {failure === "busy" && <span className="text-problem">{t("errors.busy")}</span>}
    </p>
  )
}
