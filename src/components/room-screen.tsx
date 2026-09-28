"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { roomThemes } from "@/app/sala/actions"
import { analyze } from "@/app/(app)/themes/actions"
import { ANALYSIS_FAILURES, type AnalysisFailure } from "@/components/analyze-button"
import { Logo } from "@/components/logo"
import { RoomDots, type Scene } from "@/components/room-dots"
import { Badge } from "@/components/ui/badge"
import { formatNumber, KIND_LABELS } from "@/lib/format"
import type { RoomStatus, RoomTheme } from "@/lib/room"
import {
  bubbleLayout,
  bubbleTargets,
  dotOrderByX,
  pileLayout,
  roomGroups,
  type Bubble,
  type Rect,
  type RoomGroup,
} from "@/lib/room-viz"

const POLL_MS = 3000
const LONG_QUESTION = 70
// Share of the themes' stage taken by the bubbles; the labels sit underneath.
const BUBBLE_BAND = 0.6

type Analysis = { themes: RoomTheme[]; order: number[] }

// Kit: the landing's poster scale, classes l-* and room-* in src/app/landing.css.
// Shows counts and theme titles only: no feedback text ever reaches this component.
// Two acts on one canvas (room-dots.tsx): each response is a dot that falls onto the pile above
// the count; the analysis sorts the dots into one bubble per theme.
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
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [view, setView] = useState<"bubbles" | "list">("bubbles")
  const [failure, setFailure] = useState<AnalysisFailure | "no_open_themes" | null>(null)
  const [pending, startTransition] = useTransition()

  const [main, setMain] = useState<HTMLElement | null>(null)
  const [pileArea, setPileArea] = useState<HTMLElement | null>(null)
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const pileRect = useRelativeRect(pileArea, main)
  const stageRect = useRelativeRect(stage, main)

  const pile = useMemo(() => (pileRect ? pileLayout(pileRect, status.responses) : null), [pileRect, status.responses])
  const pileRef = useRef(pile)
  useEffect(() => {
    pileRef.current = pile
  }, [pile])

  const groups = useMemo(
    () => (analysis ? roomGroups(analysis.themes, status.responses) : []),
    [analysis, status.responses]
  )
  const bubbles = useMemo(() => {
    if (!analysis || !stageRect) return null
    const band = { ...stageRect, height: stageRect.height * BUBBLE_BAND }
    const column = stageRect.width / 7.5
    const layout = bubbleLayout(
      band,
      groups.map((g) => ({ count: g.count, minWidth: g.kind === "other" ? column * 0.55 : column })),
      Math.max(12, stageRect.width * 0.018)
    )
    // On a wide screen the row is narrower than the band is tall: bubbles and labels move up
    // together, so the whole row sits in the middle of the stage.
    const lift = (band.height - Math.max(0, ...layout.bubbles.map((b) => 2 * b.radius))) / 2
    return {
      ...layout,
      labelTop: band.height - lift + Math.max(10, stageRect.height * 0.03),
      bubbles: layout.bubbles.map((b) => ({ ...b, cy: b.cy - lift, points: b.points.map((p) => ({ x: p.x, y: p.y - lift })) })),
    }
  }, [analysis, stageRect, groups])

  const scene = useMemo<Scene | null>(() => {
    if (analysis) {
      if (!bubbles) return null
      const total = bubbles.bubbles.reduce((sum, b) => sum + b.points.length, 0)
      const targets = bubbleTargets(
        analysis.order.filter((i) => i < total),
        bubbles.bubbles
      )
      return {
        mode: "bubbles",
        dots: targets.map((t) => ({ x: t.x, y: t.y, r: bubbles.dotRadius, color: groups[t.group].kind })),
        halos: bubbles.bubbles.map((b, i) => ({
          x: b.cx,
          y: b.cy,
          r: b.radius + bubbles.dotRadius * 0.6,
          color: groups[i].kind,
        })),
      }
    }
    if (!pile) return null
    return { mode: "pile", dots: pile.points.map((p) => ({ ...p, r: pile.radius, color: "ink" })), halos: [] }
  }, [analysis, bubbles, groups, pile])

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
      else {
        setView("bubbles")
        setAnalysis({ themes: next, order: dotOrderByX(pileRef.current?.points ?? []) })
      }
    })
  }

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
    <main
      ref={setMain}
      className={cn(
        "room relative isolate flex min-h-svh flex-col text-ink transition-colors duration-700 ease-out motion-reduce:transition-none",
        analysis ? "bg-paper" : "bg-highlight"
      )}
    >
      <RoomDots scene={scene} alive={pending} hidden={Boolean(analysis) && view === "list"} />

      {analysis ? (
        <ThemesView
          workspaceName={workspaceName}
          themes={analysis.themes}
          groups={groups}
          bubbles={bubbles}
          stageRect={stageRect}
          responses={status.responses}
          view={view}
          onView={setView}
          onBack={() => setAnalysis(null)}
          stageRef={setStage}
        />
      ) : (
        <>
          <RoomHeader workspaceName={workspaceName} />

          <div className="l-wrap grid flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-[4vw] pt-[1svh] pb-[4svh]">
            <div className="flex min-w-0 flex-col gap-[2svh]">
              <h1 className={cn("room-question max-w-[14em] wrap-anywhere", question.length > LONG_QUESTION && "is-long")}>
                {question}
              </h1>

              {/* The pile of dots lands here, on top of the count. */}
              <div ref={setPileArea} className="min-h-[12svh] flex-1" />

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
        </>
      )}
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

// Where an element sits inside the page, kept up to date when either changes size. Keeps the
// last value while the element is not on the page.
function useRelativeRect(element: HTMLElement | null, root: HTMLElement | null) {
  const [rect, setRect] = useState<Rect | null>(null)
  const measure = useCallback(() => {
    if (!element || !root) return
    const a = element.getBoundingClientRect()
    const b = root.getBoundingClientRect()
    const next = { x: a.left - b.left, y: a.top - b.top, width: a.width, height: a.height }
    setRect((prev) =>
      prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height
        ? prev
        : next
    )
  }, [element, root])
  useEffect(() => {
    // The observer also reports the first size, right after observe().
    if (!element || !root) return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(root)
    return () => observer.disconnect()
  }, [element, root, measure])
  return rect
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

function RoomHeader({
  workspaceName,
  onPaper = false,
  children,
}: {
  workspaceName: string
  onPaper?: boolean
  children?: ReactNode
}) {
  return (
    <header className="l-wrap flex min-h-[max(56px,9svh)] items-center gap-5">
      <p className="room-lede flex items-center gap-3 font-extrabold">
        <Logo className="size-[1.6em] text-[0.8em]" />
        {workspaceName}
      </p>
      <div className="ml-auto flex items-center gap-[2vw]">
        {children}
        <Link
          href="/collect"
          className={cn("room-lede underline-offset-4 hover:underline", onPaper ? "text-ink-muted" : "text-on-highlight")}
        >
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
  groups,
  bubbles,
  stageRect,
  responses,
  view,
  onView,
  onBack,
  stageRef,
}: {
  workspaceName: string
  themes: RoomTheme[]
  groups: RoomGroup[]
  bubbles: { bubbles: Bubble[]; labelTop: number } | null
  stageRect: Rect | null
  responses: number
  view: "bubbles" | "list"
  onView: (view: "bubbles" | "list") => void
  onBack: () => void
  stageRef: (element: HTMLElement | null) => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const toggle =
    "room-lede rounded-full px-[0.8em] py-[0.25em] font-extrabold text-ink-muted transition-colors hover:text-ink aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
  return (
    <>
      <RoomHeader workspaceName={workspaceName} onPaper>
        <div className="flex items-center rounded-full border border-line p-[0.2em]" role="group" aria-label="Come mostrare i temi">
          <button type="button" aria-pressed={view === "bubbles"} onClick={() => onView("bubbles")} className={toggle}>
            Bolle
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => onView("list")} className={toggle}>
            Elenco
          </button>
        </div>
        <button type="button" onClick={onBack} className="room-lede font-extrabold underline underline-offset-4">
          Torna al QR code
        </button>
      </RoomHeader>
      <div className="l-wrap flex flex-wrap items-end justify-between gap-x-[3vw] gap-y-2 pb-[2svh]">
        <h1 ref={heading} tabIndex={-1} className="room-panel-title outline-none">
          Cosa dice la sala
        </h1>
        <p className="room-lede text-ink-muted">{themesSummary(responses, themes)}</p>
      </div>

      {view === "bubbles" ? (
        <div className="l-wrap flex flex-1 flex-col pb-[3svh]">
          <div ref={stageRef} className="relative min-h-0 flex-1">
            {bubbles && stageRect && (
              <ol className="contents">
                {groups.map((group, i) => {
                  const bubble = bubbles.bubbles[i]
                  return (
                    <li
                      key={group.id}
                      className="room-bubble-label absolute flex flex-col items-center gap-[0.8svh] text-center"
                      style={{
                        left: bubble.column.x - stageRect.x,
                        width: bubble.column.width,
                        top: bubbles.labelTop,
                        animationDelay: `${1200 + i * 90}ms`,
                      }}
                    >
                      {group.kind === "other" ? (
                        <span className="room-lede text-ink-muted">Altro</span>
                      ) : (
                        <>
                          <span className="room-bubble-count">{formatNumber(group.count)}</span>
                          <Badge variant={group.kind} className="room-kind">
                            {KIND_LABELS[group.kind]}
                          </Badge>
                          <p className="room-bubble-title">{group.title}</p>
                        </>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
      ) : (
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
      )}
    </>
  )
}

const KIND_COUNTS: Record<RoomTheme["kind"], [string, string]> = {
  problem: ["problema", "problemi"],
  opportunity: ["opportunità", "opportunità"],
  praise: ["apprezzamento", "apprezzamenti"],
}

// "230 risposte, 5 temi: 2 problemi, 2 opportunità, 1 apprezzamento." What the bubbles say, in words.
function themesSummary(responses: number, themes: RoomTheme[]) {
  const plural = (n: number, [one, many]: [string, string]) => `${formatNumber(n)} ${n === 1 ? one : many}`
  const kinds = (Object.keys(KIND_COUNTS) as RoomTheme["kind"][])
    .map((kind) => [kind, themes.filter((t) => t.kind === kind).length] as const)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => plural(n, KIND_COUNTS[kind]))
  return `${plural(responses, ["risposta", "risposte"])}, ${plural(themes.length, ["tema", "temi"])}: ${kinds.join(", ")}.`
}
