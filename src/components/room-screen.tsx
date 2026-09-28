"use client"

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { roomThemes } from "@/app/sala/actions"
import { analyze } from "@/app/(app)/themes/actions"
import { ANALYSIS_FAILURES, type AnalysisFailure } from "@/components/analyze-button"
import { Logo } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { formatNumber, KIND_LABELS } from "@/lib/format"
import type { RoomStatus, RoomTheme } from "@/lib/room"

const POLL_MS = 3000
const LONG_QUESTION = 70

// Kit: the landing's poster scale, classes l-* and room-* in src/app/landing.css.
// Shows counts and theme titles only: no feedback text ever reaches this component.
export function RoomScreen({
  workspaceName,
  question,
  shortUrl,
  qrCode,
  initialStatus,
  limitNote,
}: {
  workspaceName: string
  question: string
  shortUrl: string
  qrCode: ReactNode
  initialStatus: RoomStatus
  limitNote?: string
}) {
  const status = useRoomStatus(initialStatus)
  const [themes, setThemes] = useState<RoomTheme[] | null>(null)
  const [failure, setFailure] = useState<AnalysisFailure | "no_open_themes" | null>(null)
  const [pending, startTransition] = useTransition()

  function runAnalysis() {
    setFailure(null)
    startTransition(async () => {
      const result = await analyze()
      if (!result.ok) {
        setFailure(result.reason)
        return
      }
      const next = await roomThemes()
      if (next.length === 0) setFailure("no_open_themes")
      else setThemes(next)
    })
  }

  if (themes)
    return (
      <ThemesView
        workspaceName={workspaceName}
        themes={themes}
        responses={status.responses}
        onBack={() => setThemes(null)}
      />
    )

  const note = pending
    ? "Può volerci qualche minuto. I temi compaiono qui appena è finita."
    : failure === "no_open_themes"
      ? "L'analisi è finita, ma non ci sono temi aperti da mostrare. Li trovi in Temi."
      : failure
        ? ANALYSIS_FAILURES[failure]
        : limitNote
          ? limitNote
          : status.responses === 0
            ? "Si accende con la prima risposta."
            : undefined

  return (
    <main className="room flex min-h-svh flex-col bg-highlight text-ink">
      <RoomHeader workspaceName={workspaceName} />

      <div className="l-wrap grid flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-[4vw] pt-[1svh] pb-[4svh]">
        <div className="flex min-w-0 flex-col justify-between gap-[3svh]">
          <h1 className={cn("room-question max-w-[14em] wrap-anywhere", question.length > LONG_QUESTION && "is-long")}>
            {question}
          </h1>

          <div className="flex flex-col gap-[3svh]">
            <Counter responses={status.responses} />
            <div className="flex flex-wrap items-center gap-x-[2vw] gap-y-3">
              <button
                type="button"
                className="l-cta"
                onClick={runAnalysis}
                disabled={pending || Boolean(limitNote) || status.responses === 0}
              >
                {pending ? "Analisi in corso…" : "Analizza le risposte"}
              </button>
              <p
                role="status"
                className={cn(
                  "room-lede max-w-[34ch] empty:hidden",
                  failure && !pending ? "text-problem" : "text-on-highlight"
                )}
              >
                {note}
              </p>
            </div>
          </div>
        </div>

        <aside className="flex max-w-[min(52svh,30vw)] flex-col justify-center gap-[2svh] self-center">
          {status.form === "open" ? (
            <>
              <p className="room-lede">Inquadra e rispondi dal telefono. Non serve un account.</p>
              {qrCode}
              <p className="room-url">{shortUrl}</p>
            </>
          ) : status.form === "off" ? (
            <FormPanel
              title="Il modulo è spento."
              text="Chi inquadra il QR code non trova il modulo."
              href="/collect"
              action="Riaccendi il link in Raccolta"
            />
          ) : (
            <FormPanel
              title="Il modulo è pieno."
              text="Con il piano Free entrano al massimo 100 feedback: le nuove risposte non arrivano."
              href="/billing"
              action="Passa a Pro"
            />
          )}
        </aside>
      </div>
    </main>
  )
}

// Asks the server every few seconds, one call at a time. A failed call keeps the last count.
function useRoomStatus(initial: RoomStatus) {
  const [status, setStatus] = useState(initial)
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const response = await fetch("/sala/status", { cache: "no-store" })
        if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
          const next: RoomStatus = await response.json()
          if (!stopped) setStatus(next)
        }
      } catch {
        // Offline for a moment: the next call tries again.
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS)
    }
    timer = setTimeout(poll, POLL_MS)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [])
  return status
}

function Counter({ responses }: { responses: number }) {
  // The number jumps a little when it goes up; not on the first render, not with reduced motion.
  const [first] = useState(responses)
  return (
    <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-[1.2vw]">
      <span key={responses} className={cn("room-count", responses !== first && "room-bump")}>
        {formatNumber(responses)}
      </span>{" "}
      <span className="room-unit">{responses === 1 ? "risposta" : "risposte"}</span>
    </p>
  )
}

function RoomHeader({ workspaceName, children }: { workspaceName: string; children?: ReactNode }) {
  return (
    <header className="l-wrap flex min-h-[max(56px,9svh)] items-center gap-5">
      <p className="room-lede flex items-center gap-3 font-extrabold">
        <Logo className="size-[1.6em] text-[0.8em]" />
        {workspaceName}
      </p>
      <div className="ml-auto flex items-center gap-[2vw]">
        {children}
        <Link href="/collect" className="room-lede text-on-highlight underline-offset-4 hover:underline">
          Esci dallo schermo
        </Link>
      </div>
    </header>
  )
}

function FormPanel({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <div className="flex w-[min(52svh,30vw)] flex-col gap-[2svh] rounded-lg bg-ink p-[3svh] text-paper">
      <p className="room-panel-title text-highlight">{title}</p>
      <p className="room-lede">{text}</p>
      <Link href={href} className="room-lede font-extrabold text-highlight underline underline-offset-4 focus-visible:outline-highlight">
        {action}
      </Link>
    </div>
  )
}

function ThemesView({
  workspaceName,
  themes,
  responses,
  onBack,
}: {
  workspaceName: string
  themes: RoomTheme[]
  responses: number
  onBack: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <main className="room flex min-h-svh flex-col bg-paper text-ink">
      <div className="bg-highlight">
        <RoomHeader workspaceName={workspaceName}>
          <button type="button" onClick={onBack} className="room-lede font-extrabold underline underline-offset-4">
            Torna al QR code
          </button>
        </RoomHeader>
        <div className="l-wrap flex flex-wrap items-end justify-between gap-x-[3vw] gap-y-2 pb-[3svh]">
          <h1 ref={heading} tabIndex={-1} className="room-panel-title outline-none">
            Cosa dice la sala
          </h1>
          <p className="room-lede text-on-highlight">
            {formatNumber(responses)} {responses === 1 ? "risposta" : "risposte"}. Temi in ordine di feedback.
          </p>
        </div>
      </div>
      <ol className="l-wrap flex flex-1 flex-col justify-center py-[2svh]">
        {themes.map((theme) => (
          <li
            key={theme.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-[2.4vw] border-b border-line py-[1.6svh] last:border-b-0"
          >
            <span className="room-theme-count w-[1.8em] text-right">{formatNumber(theme.feedbackCount)}</span>
            <div className="min-w-0">
              <Badge variant={theme.kind} className="room-kind mb-[0.6svh]">
                {KIND_LABELS[theme.kind]}
              </Badge>
              <p className="room-theme-title">{theme.title}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  )
}
