"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { useLocale, useTranslations } from "next-intl"
import { roomThemes } from "@/app/sala/actions"
import { analyze } from "@/app/(app)/themes/actions"
import { failureMessage, type AnalysisFailure } from "@/components/analyze-button"
import { Logo } from "@/components/logo"
import { RoomDots } from "@/components/room-dots"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/i18n/locale"
import { formatNumber } from "@/lib/format"
import type { RoomStatus, RoomTheme } from "@/lib/room"
import {
  dotOrderByX,
  LABEL_DELAY,
  LABEL_STEP,
  pilePlaces,
  pileScene,
  pileStep,
  roomGroups,
  themesLayout,
  themesScene,
  type Label,
  type Rect,
  type RoomGroup,
} from "@/lib/room-viz"

const POLL_MS = 3000
const LONG_QUESTION = 70

// The themes, the count when they arrived, and the pile's dots from left to right at that moment.
type Analysis = { themes: RoomTheme[]; responses: number; order: number[] }
type Failure = AnalysisFailure | "no_open_themes"
type View = "bubbles" | "list"
// The act on screen: the pile, with the last analysis failure if any, or the themes.
type Screen = { act: "pile"; failure: Failure | null } | { act: "themes"; analysis: Analysis; view: View }

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
  const [screen, setScreen] = useState<Screen>({ act: "pile", failure: null })
  const [pending, startTransition] = useTransition()

  const [main, setMain] = useState<HTMLElement | null>(null)
  const [pileArea, setPileArea] = useState<HTMLElement | null>(null)
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const pileRect = useRelativeRect(pileArea, main)
  const stageRect = useRelativeRect(stage, main)

  // The whole step is laid out once; a new response only takes the next place.
  const step = pileStep(status.responses)
  const places = useMemo(() => (pileRect ? pilePlaces(pileRect, step) : null), [pileRect, step])
  const placesRef = useRef(places)
  const responsesRef = useRef(status.responses)
  useEffect(() => {
    placesRef.current = places
    responsesRef.current = status.responses
  }, [places, status.responses])

  const analysis = screen.act === "themes" ? screen.analysis : null
  // Laid out once per analysis, with the counts it found; the live groups only grow "Altro".
  const layout = useMemo(
    () => (analysis && stageRect ? themesLayout(stageRect, roomGroups(analysis.themes, analysis.responses)) : null),
    [analysis, stageRect]
  )
  const groups = useMemo(() => (analysis ? roomGroups(analysis.themes, status.responses) : []), [analysis, status.responses])
  const scene = useMemo(() => {
    if (analysis) return layout ? themesScene(layout, groups, analysis.order) : null
    return places ? pileScene(places, status.responses) : null
  }, [analysis, layout, groups, places, status.responses])

  function runAnalysis() {
    setScreen({ act: "pile", failure: null })
    startTransition(async () => {
      const result = await analyze()
      if (!result.ok) return setScreen({ act: "pile", failure: result.reason })
      const themes = await roomThemes()
      const responses = responsesRef.current
      setScreen(
        themes.length === 0
          ? { act: "pile", failure: "no_open_themes" }
          : {
              act: "themes",
              view: "bubbles",
              analysis: { themes, responses, order: dotOrderByX(placesRef.current?.points.slice(0, responses) ?? []) },
            }
      )
    })
  }

  return (
    <main
      ref={setMain}
      className={cn(
        "room relative isolate flex min-h-svh flex-col text-ink transition-colors duration-700 ease-out motion-reduce:transition-none",
        screen.act === "themes" ? "bg-paper" : "bg-highlight"
      )}
    >
      <RoomDots scene={scene} alive={pending} hidden={screen.act === "themes" && screen.view === "list"} />

      {screen.act === "themes" ? (
        <ThemesView
          workspaceName={workspaceName}
          groups={groups}
          labels={layout?.labels ?? null}
          responses={status.responses}
          view={screen.view}
          onView={(view) => setScreen({ ...screen, view })}
          onBack={() => setScreen({ act: "pile", failure: null })}
          stageRef={setStage}
        />
      ) : (
        <PileView
          workspaceName={workspaceName}
          question={question}
          shortUrl={shortUrl}
          qrCode={qrCode}
          status={status}
          limitNote={limitNote}
          failure={screen.failure}
          pending={pending}
          onAnalyze={runAnalysis}
          pileRef={setPileArea}
        />
      )}
    </main>
  )
}

// Act 1: the question, the pile over the count, the analysis button and the QR code.
function PileView({
  workspaceName,
  question,
  shortUrl,
  qrCode,
  status,
  limitNote,
  failure,
  pending,
  onAnalyze,
  pileRef,
}: {
  workspaceName: string
  question: string
  shortUrl: string
  qrCode: ReactNode
  status: RoomStatus
  limitNote?: string
  failure: Failure | null
  pending: boolean
  onAnalyze: () => void
  pileRef: (element: HTMLElement | null) => void
}) {
  const t = useTranslations("room")
  const tFailures = useTranslations("themes.analyzeButton.failures")
  const note = pending
    ? t("pile.runningNote")
    : failure === "no_open_themes"
      ? t("pile.noOpenThemes")
      : failure
        ? failureMessage(tFailures, failure)
        : limitNote
          ? limitNote
          : status.responses === 0
            ? t("pile.idle")
            : undefined

  return (
    <>
      <RoomHeader workspaceName={workspaceName} />

      <div className="l-wrap grid flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-[4vw] pt-[1svh] pb-[4svh]">
        <div className="flex min-w-0 flex-col gap-[2svh]">
          <h1 className={cn("room-question max-w-[14em] wrap-anywhere", question.length > LONG_QUESTION && "is-long")}>
            {question}
          </h1>

          {/* The pile of dots lands here, on top of the count. */}
          <div ref={pileRef} className="min-h-[12svh] flex-1" />

          <div className="flex flex-col gap-[3svh]">
            <Counter responses={status.responses} />
            <div className="flex flex-wrap items-center gap-x-[2vw] gap-y-3">
              <button
                type="button"
                className="l-cta"
                onClick={onAnalyze}
                disabled={pending || Boolean(limitNote) || status.responses === 0}
              >
                {pending ? t("pile.running") : t("pile.analyze")}
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
              <p className="room-lede">{t("pile.scanHelp")}</p>
              {qrCode}
              <p className="room-url">{shortUrl}</p>
            </>
          ) : status.form === "off" ? (
            <FormPanel
              title={t("pile.formOff.title")}
              text={t("pile.formOff.text")}
              href="/collect"
              action={t("pile.formOff.action")}
            />
          ) : (
            <FormPanel
              title={t("pile.formFull.title")}
              text={t("pile.formFull.text")}
              href="/billing"
              action={t("pile.formFull.action")}
            />
          )}
        </aside>
      </div>
    </>
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
    // The observer also reports the first size, right after observe(). Several reports in one
    // frame (a window being dragged) make one measure.
    if (!element || !root) return
    let frame = 0
    const observer = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0
        measure()
      })
    })
    observer.observe(element)
    observer.observe(root)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [element, root, measure])
  return rect
}

function Counter({ responses }: { responses: number }) {
  const locale = useLocale()
  const t = useTranslations("room.units")
  // The number jumps a little when it goes up; not on the first render, not with reduced motion.
  const [first] = useState(responses)
  return (
    <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-[1.2vw]">
      <span key={responses} className={cn("room-count", responses !== first && "room-bump")}>
        {formatNumber(responses, locale)}
      </span>{" "}
      <span className="room-unit">{t("response", { count: responses })}</span>
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
  const t = useTranslations("room")
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
          {t("exit")}
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

type ThemeGroup = RoomGroup & { kind: RoomTheme["kind"] }

// Act 2: the themes as bubbles (drawn on the canvas, labels here) or as a list.
function ThemesView({
  workspaceName,
  groups,
  labels,
  responses,
  view,
  onView,
  onBack,
  stageRef,
}: {
  workspaceName: string
  groups: RoomGroup[]
  labels: Label[] | null
  responses: number
  view: View
  onView: (view: View) => void
  onBack: () => void
  stageRef: (element: HTMLElement | null) => void
}) {
  const t = useTranslations("room")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const themes = groups.filter((g): g is ThemeGroup => g.kind !== "other")
  const toggle =
    "room-lede rounded-full px-[0.8em] py-[0.25em] font-extrabold text-ink-muted transition-colors hover:text-ink aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
  return (
    <>
      <RoomHeader workspaceName={workspaceName} onPaper>
        <div className="flex items-center rounded-full border border-line p-[0.2em]" role="group" aria-label={t("themesView.modeGroupLabel")}>
          <button type="button" aria-pressed={view === "bubbles"} onClick={() => onView("bubbles")} className={toggle}>
            {t("themesView.bubbles")}
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => onView("list")} className={toggle}>
            {t("themesView.list")}
          </button>
        </div>
        <button type="button" onClick={onBack} className="room-lede font-extrabold underline underline-offset-4">
          {t("themesView.back")}
        </button>
      </RoomHeader>
      <div className="l-wrap flex flex-wrap items-end justify-between gap-x-[3vw] gap-y-2 pb-[2svh]">
        <h1 ref={heading} tabIndex={-1} className="room-panel-title outline-none">
          {t("themesView.heading")}
        </h1>
        <p className="room-lede text-ink-muted">{themesSummary(responses, themes, t, tCommon, locale)}</p>
      </div>

      {view === "bubbles" ? (
        <div className="l-wrap flex flex-1 flex-col pb-[3svh]">
          <div ref={stageRef} className="relative min-h-0 flex-1">
            {labels && (
              <ol className="contents">
                {groups.map((group, i) => (
                  <li
                    key={group.id}
                    className="room-bubble-label absolute flex flex-col items-center gap-[0.8svh] text-center"
                    style={{
                      left: labels[i].x,
                      width: labels[i].width,
                      top: labels[i].top,
                      animationDelay: `${LABEL_DELAY + i * LABEL_STEP}ms`,
                    }}
                  >
                    {group.kind === "other" ? (
                      group.count > 0 && <span className="room-lede text-ink-muted">{t("themesView.other")}</span>
                    ) : (
                      <ThemeLabel kind={group.kind} title={group.title} count={group.count} layout="bubble" />
                    )}
                  </li>
                ))}
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
              <ThemeLabel kind={theme.kind} title={theme.title} count={theme.count} layout="row" />
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

type RoomT = ReturnType<typeof useTranslations<"room">>
type CommonT = ReturnType<typeof useTranslations<"common">>

// "230 risposte, 5 temi: 2 problemi, 2 opportunità, 1 apprezzamento." What the bubbles say, in words.
function themesSummary(responses: number, themes: ThemeGroup[], t: RoomT, tCommon: CommonT, locale: Locale) {
  const plural = (n: number, one: string, many: string) => `${formatNumber(n, locale)} ${n === 1 ? one : many}`
  const kinds = (["problem", "opportunity", "praise"] as const)
    .map((kind) => [kind, themes.filter((th) => th.kind === kind).length] as const)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => plural(n, tCommon(`kind.${kind}`).toLowerCase(), tCommon(`kindPlural.${kind}`).toLowerCase()))
  return t("themesView.summary", {
    responses: `${formatNumber(responses, locale)} ${t("units.response", { count: responses })}`,
    themes: `${formatNumber(themes.length, locale)} ${t("units.theme", { count: themes.length })}`,
    kinds: kinds.join(", "),
  })
}

// Count, kind and title of a theme: under its bubble, or as a row of the list.
function ThemeLabel({
  kind,
  title,
  count,
  layout,
}: {
  kind: RoomTheme["kind"]
  title: string
  count: number
  layout: "bubble" | "row"
}) {
  const locale = useLocale()
  const tCommon = useTranslations("common")
  const bubble = layout === "bubble"
  return (
    <>
      <span className={bubble ? "room-bubble-count" : "room-theme-count w-[1.8em] text-right"}>{formatNumber(count, locale)}</span>
      <div className={bubble ? "flex flex-col items-center gap-[0.8svh]" : "min-w-0"}>
        <Badge variant={kind} className={cn("room-kind", !bubble && "mb-[0.6svh]")}>
          {tCommon(`kind.${kind}`)}
        </Badge>
        <p className={bubble ? "room-bubble-title" : "room-theme-title"}>{title}</p>
      </div>
    </>
  )
}
