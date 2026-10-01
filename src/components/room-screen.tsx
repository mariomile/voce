"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { useLocale, useTranslations } from "next-intl"
import { roomThemes, roomVerdicts } from "@/app/research/[id]/sala/actions"
import { synthesize } from "@/app/(app)/research/[id]/actions"
import { failureMessage, type AnalysisFailure } from "@/components/analyze-button"
import { Logo } from "@/components/logo"
import { RoomDots } from "@/components/room-dots"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/i18n/locale"
import { formatNumber } from "@/lib/format"
import type { RoomStatus, RoomTheme, RoomVerdict } from "@/lib/room"
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

// The live status, plus "deleted" once /sala/status answers 404: the Research is gone (R1).
type ScreenStatus = { responses: number; form: RoomStatus["form"] | "deleted" }

// The verdict of this click: the hypotheses with their verdict, or why it did not come (failed, or only one
// analysis was left in the month and it went to the themes).
export type VerdictOutcome = { state: "done"; hypotheses: RoomVerdict[] } | { state: "failed" | "limit" }
// The themes (none when they failed or none is open, with a verdict), the count when they arrived, the
// pile's dots from left to right at that moment, and the verdict, null when the Research has no hypotheses.
type Analysis = {
  themes: RoomTheme[]
  // Why no theme of this click: the call failed, or the answers gave none (too few, or all different).
  themesMissing: "failed" | "no_themes" | null
  responses: number
  order: number[]
  verdict: VerdictOutcome | null
}
// network: a call that never answered (the connection dropped, the server ran past its time).
type Failure = AnalysisFailure | "no_open_themes" | "network"
type View = "bubbles" | "list" | "verdict"
// What a click of "Analizza le risposte" brings: why the pile stays, or what the themes act shows.
type RoomAnalysis = { failure: Failure } | Pick<Analysis, "themes" | "themesMissing" | "verdict">

// The same analysis as the Sintesi: the themes and, with hypotheses, their verdict. Never throws: a call
// that rejects is a network failure, so the projected screen keeps the pile instead of the error page.
export async function analyzeRoom(researchId: string): Promise<RoomAnalysis> {
  try {
    const result = await synthesize(researchId)
    if (!result.ok) return { failure: result.reason }
    // Never the themes of before: without this click's themes (they failed, or none is open) the verdict
    // shows alone, and without a verdict either the pile says why.
    const themesDone = result.themes === "done"
    const themes = themesDone ? await roomThemes(researchId) : []
    const verdict: VerdictOutcome | null =
      result.verdict === "skipped"
        ? null
        : result.verdict === "done"
          ? { state: "done", hypotheses: await roomVerdicts(researchId) }
          : { state: result.verdict }
    if (themes.length === 0 && verdict?.state !== "done") {
      return { failure: themesDone ? "no_open_themes" : result.themes === "no_themes" ? "no_themes" : "failed" }
    }
    return { themes, themesMissing: themesDone ? null : result.themes === "no_themes" ? "no_themes" : "failed", verdict }
  } catch {
    return { failure: "network" }
  }
}
// The act on screen: the pile, with the last analysis failure if any, or the themes.
type Screen = { act: "pile"; failure: Failure | null } | { act: "themes"; analysis: Analysis; view: View }

// Kit: the landing's poster scale, classes l-* and room-* in src/app/landing.css.
// Shows counts, theme titles, and the PM's hypotheses with the word of their verdict: no feedback text ever
// reaches this component. Two acts on one canvas (room-dots.tsx): each response is a dot that falls onto
// the pile above the count; the analysis sorts the dots into one bubble per theme.
export function RoomScreen({
  researchId,
  workspaceName,
  question,
  shortUrl,
  qrCode,
  initialStatus,
  limitNote,
  hasHypotheses,
}: {
  researchId: string
  workspaceName: string
  question: string
  shortUrl: string
  qrCode: ReactNode
  initialStatus: RoomStatus
  limitNote?: string
  // "Analizza le risposte" also runs the verdict of the hypotheses: the pile says so.
  hasHypotheses: boolean
}) {
  const status = useRoomStatus(initialStatus, `/research/${researchId}/sala/status`)
  // "Esci dallo schermo" and "Riaccendi il link" go back to the Raccolta of this Research.
  const collectHref = `/research/${researchId}/collect`
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
    // aria-disabled, not disabled: the button keeps the focus, so the click is refused here.
    if (pending || limitNote || status.responses === 0) return
    setScreen({ act: "pile", failure: null })
    startTransition(async () => {
      const result = await analyzeRoom(researchId)
      if ("failure" in result) return setScreen({ act: "pile", failure: result.failure })
      const responses = responsesRef.current
      setScreen({
        act: "themes",
        view: result.themes.length === 0 ? "verdict" : "bubbles",
        analysis: {
          ...result,
          responses,
          order: dotOrderByX(placesRef.current?.points.slice(0, responses) ?? []),
        },
      })
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
      <RoomDots scene={scene} alive={pending} hidden={screen.act === "themes" && screen.view !== "bubbles"} />

      {screen.act === "themes" ? (
        <ThemesView
          workspaceName={workspaceName}
          collectHref={collectHref}
          groups={groups}
          labels={layout?.labels ?? null}
          responses={status.responses}
          verdict={screen.analysis.verdict}
          themesNote={
            screen.analysis.themes.length > 0
              ? null
              : screen.analysis.themesMissing === "no_themes"
                ? "noThemes"
                : screen.analysis.themesMissing === "failed"
                  ? "themesFailed"
                  : "noOpenThemes"
          }
          view={screen.view}
          onView={(view) => setScreen({ ...screen, view })}
          onBack={() => setScreen({ act: "pile", failure: null })}
          stageRef={setStage}
        />
      ) : (
        <PileView
          workspaceName={workspaceName}
          collectHref={collectHref}
          question={question}
          shortUrl={shortUrl}
          qrCode={qrCode}
          status={status}
          limitNote={limitNote}
          hasHypotheses={hasHypotheses}
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
  collectHref,
  question,
  shortUrl,
  qrCode,
  status,
  limitNote,
  hasHypotheses,
  failure,
  pending,
  onAnalyze,
  pileRef,
}: {
  workspaceName: string
  collectHref: string
  question: string
  shortUrl: string
  qrCode: ReactNode
  status: ScreenStatus
  limitNote?: string
  hasHypotheses: boolean
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
      : failure === "network"
        ? t("pile.network")
        : failure
          ? failureMessage(tFailures, failure)
          : limitNote
            ? limitNote
            : status.responses === 0
              ? t("pile.idle")
              : undefined

  return (
    <>
      <RoomHeader workspaceName={workspaceName} exitHref={collectHref} />

      <div className="l-wrap grid flex-1 grid-cols-1 gap-x-[4vw] gap-y-[4svh] pt-[1svh] pb-[4svh] sm:grid-cols-[minmax(0,1fr)_auto]">
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
                aria-disabled={pending || Boolean(limitNote) || status.responses === 0 || undefined}
              >
                {pending ? t("pile.running") : t("pile.analyze")}
              </button>
              {/* A failure reads in ink, the only colour at 7:1 on the highlight besides on-highlight. */}
              <p
                role="status"
                className={cn("room-lede max-w-[34ch] empty:hidden", failure && !pending ? "text-ink" : "text-on-highlight")}
              >
                {note}
              </p>
            </div>
            {hasHypotheses && <p className="room-lede max-w-[40ch] text-on-highlight">{t("hypothesesNote")}</p>}
          </div>
        </div>

        <aside className="flex max-w-[min(52svh,80vw)] flex-col justify-center gap-[2svh] self-center sm:max-w-[min(52svh,30vw)]">
          {status.form === "deleted" ? (
            <FormPanel title={t("deleted.title")} text={t("deleted.text")} href="/research" action={t("deleted.action")} />
          ) : status.form === "open" ? (
            <>
              <p className="room-lede">{t("pile.scanHelp")}</p>
              {qrCode}
              <p className="room-url">{shortUrl}</p>
            </>
          ) : status.form === "off" ? (
            <FormPanel
              title={t("pile.formOff.title")}
              text={t("pile.formOff.text")}
              href={collectHref}
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

// Asks the server every few seconds, one call at a time. A failed call keeps the last count. A 404 means
// the Research was deleted (or is no longer the user's): the screen says so and stops asking.
function useRoomStatus(initial: RoomStatus, url: string) {
  const [status, setStatus] = useState<ScreenStatus>(initial)
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const response = await fetch(url, { cache: "no-store" })
        if (response.status === 404) {
          if (!stopped) setStatus((current) => ({ ...current, form: "deleted" }))
          return
        }
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
  }, [url])
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
  exitHref,
  onPaper = false,
  children,
}: {
  workspaceName: string
  exitHref: string
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
          href={exitHref}
          className={cn("room-lede underline-offset-4 hover:underline", onPaper ? "text-ink" : "text-on-highlight")}
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
  collectHref,
  groups,
  labels,
  responses,
  verdict,
  themesNote,
  view,
  onView,
  onBack,
  stageRef,
}: {
  workspaceName: string
  collectHref: string
  groups: RoomGroup[]
  labels: Label[] | null
  responses: number
  verdict: VerdictOutcome | null
  // Why the verdict shows without themes.
  themesNote: "themesFailed" | "noThemes" | "noOpenThemes" | null
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
    "room-lede rounded-full px-[0.8em] py-[0.25em] font-extrabold text-ink transition-colors hover:bg-veil aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
  return (
    <>
      <RoomHeader workspaceName={workspaceName} exitHref={collectHref} onPaper>
        {!themesNote && (
          <div className="flex items-center rounded-full border border-line p-[0.2em]" role="group" aria-label={t("themesView.modeGroupLabel")}>
            <button type="button" aria-pressed={view === "bubbles"} onClick={() => onView("bubbles")} className={toggle}>
              {t("themesView.bubbles")}
            </button>
            <button type="button" aria-pressed={view === "list"} onClick={() => onView("list")} className={toggle}>
              {t("themesView.list")}
            </button>
            {verdict && (
              <button type="button" aria-pressed={view === "verdict"} onClick={() => onView("verdict")} className={toggle}>
                {t("themesView.verdict")}
              </button>
            )}
          </div>
        )}
        <button type="button" onClick={onBack} className="room-lede font-extrabold underline underline-offset-4">
          {t("themesView.back")}
        </button>
      </RoomHeader>
      <div className="l-wrap flex flex-wrap items-end justify-between gap-x-[3vw] gap-y-2 pb-[2svh]">
        <h1 ref={heading} tabIndex={-1} className="room-panel-title outline-none">
          {view === "verdict" ? t("verdictView.heading") : t("themesView.heading")}
        </h1>
        {view !== "verdict" && <p className="room-lede text-ink">{themesSummary(responses, themes, t, tCommon, locale)}</p>}
        {themesNote && (
          <p className="room-lede max-w-[40ch] text-ink">
            {themesNote === "noOpenThemes" ? t("pile.noOpenThemes") : t(`verdictView.${themesNote}`)}
          </p>
        )}
      </div>

      {view === "verdict" && verdict ? (
        <VerdictView verdict={verdict} />
      ) : view === "bubbles" ? (
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
                      group.count > 0 && <span className="room-lede text-ink">{t("themesView.other")}</span>
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
        {/* The dot keeps the colour of the kind; the word is ink, readable from the back of the room. */}
        <Badge variant={kind} className={cn("room-kind", !bubble && "mb-[0.6svh]")}>
          <span className="text-ink">{tCommon(`kind.${kind}`)}</span>
        </Badge>
        <p className={bubble ? "room-bubble-title" : "room-theme-title"}>{title}</p>
      </div>
    </>
  )
}

// The word of a verdict with its sign, as in the Sintesi: ink, no colour, the sign is decorative.
const VERDICT_WORDS = {
  confirmed: { sign: "✓", key: "confirmed" },
  refuted: { sign: "✕", key: "refuted" },
  to_review: { sign: "?", key: "toReview" },
} as const

// Act 2, third view: each hypothesis the PM wrote, then the word of its verdict and the counts. Never the
// reasoning or the quotes, which are feedback text; without this click's verdict, why.
export function VerdictView({ verdict }: { verdict: VerdictOutcome }) {
  const t = useTranslations("room.verdictView")
  const tVerdict = useTranslations("research.verdict")
  const locale = useLocale()
  if (verdict.state !== "done" || verdict.hypotheses.length === 0) {
    return (
      <div className="l-wrap flex flex-1 flex-col justify-center py-[2svh]">
        <p className="room-theme-title max-w-[28ch]">{t(verdict.state === "done" ? "none" : verdict.state)}</p>
      </div>
    )
  }
  // One hypothesis, the usual case on stage, is the punchline: its word at poster scale, the counts under it.
  const single = verdict.hypotheses.length === 1
  const n = (count: number) => formatNumber(count, locale)
  return (
    <ol className="l-wrap flex flex-1 flex-col justify-center py-[2svh]">
      {verdict.hypotheses.map((h) => {
        const word = VERDICT_WORDS[h.verdict]
        return (
          <li key={h.id} className="flex flex-col gap-[1.6svh] border-b border-line py-[2.4svh] last:border-b-0">
            <p className="room-theme-title max-w-[40ch] wrap-anywhere">{h.text}</p>
            <p className={cn("flex gap-x-[2vw] gap-y-[1svh]", single ? "flex-col" : "flex-wrap items-baseline")}>
              <span className={single ? "room-verdict" : "room-panel-title"}>
                <span aria-hidden="true">{word.sign}</span> {tVerdict(word.key)}
              </span>
              <span className={single ? "room-theme-title" : "room-lede text-ink"}>
                {h.supporting + h.contradicting > 0
                  ? tVerdict("counts", { supporting: n(h.supporting), contradicting: n(h.contradicting), read: n(h.feedbackRead) })
                  : tVerdict("noEvidence", { read: n(h.feedbackRead) })}
              </span>
            </p>
          </li>
        )
      })}
    </ol>
  )
}
