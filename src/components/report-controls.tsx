"use client"

import { cn } from "cn"
import { Check, Copy, Printer } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import { generateReport, type ReportResult } from "@/app/(app)/research/[id]/report/actions"
import { Button, buttonVariants } from "@/components/ui/button"

type Failure = Extract<ReportResult, { ok: false }>["reason"] | "network"

const FAILURE_KEYS: Record<Exclude<Failure, "limit">, string> = {
  failed: "failed",
  busy: "busy",
  no_synthesis: "noSynthesis",
  not_found: "notFound",
  session: "session",
  network: "network",
}

// The actions of the Report tab, in one place of the page whether a report exists or not, so the button keeps
// the focus when the first report lands and the page refreshes. markdown: the report as text, once there is
// one (Copia, Stampa). primary: "Genera" or "Rigenera" as the main action of the page. note: its cost.
// limitMessage: what the plan says once the month's analyses are used up; atLimit: they already are, so the
// button is off. The server has the last word: a report refused for the quota shows limitMessage too.
export function ReportControls({
  researchId,
  markdown,
  primary,
  note,
  limitMessage,
  atLimit,
}: {
  researchId: string
  markdown?: string
  primary: boolean
  note: string
  limitMessage: string
  atLimit: boolean
}) {
  const t = useTranslations("report.page")
  const [pending, startTransition] = useTransition()
  const [failure, setFailure] = useState<Failure | null>(null)
  const [announcement, setAnnouncement] = useState("")

  function run() {
    if (pending || atLimit) return
    setFailure(null)
    setAnnouncement("")
    startTransition(async () => {
      const result = await generateReport(researchId).catch(() => ({ ok: false as const, reason: "network" as const }))
      if (result.ok) setAnnouncement(t("done"))
      else setFailure(result.reason)
    })
  }

  const label = markdown ? t("regenerate") : t("generate")
  return (
    <div className={cn("flex flex-col items-start gap-3 print:hidden", markdown && "sm:items-end sm:[&_p]:text-right")}>
      <div className={cn("flex flex-wrap items-center gap-2", markdown && "sm:justify-end")}>
        {markdown && <CopyButton markdown={markdown} onAnnounce={setAnnouncement} />}
        {markdown && (
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" />
            {t("print")}
          </Button>
        )}
        <Button
          variant={primary ? "default" : "secondary"}
          size={markdown ? "sm" : "lg"}
          onClick={run}
          aria-disabled={pending || atLimit || undefined}
        >
          {pending ? t("running") : label}
        </Button>
      </div>
      <p className="max-w-[44ch] text-sm text-ink-muted">
        {pending ? t("runningNote") : atLimit ? limitMessage : note}
      </p>
      <p role="status" className="max-w-[44ch] text-sm empty:hidden">
        {failure === "session" ? (
          <span className="text-problem">
            {t("failures.session")}{" "}
            <Link href="/login" className={buttonVariants({ variant: "link", className: "text-sm" })}>
              {t("failures.sessionLink")}
            </Link>
          </span>
        ) : failure && failure !== "limit" ? (
          <span className="text-problem">{t(`failures.${FAILURE_KEYS[failure]}` as "failures.failed")}</span>
        ) : failure === "limit" ? (
          <span className="text-problem">{limitMessage}</span>
        ) : (
          announcement
        )}
      </p>
    </div>
  )
}

function CopyButton({ markdown, onAnnounce }: { markdown: string; onAnnounce: (text: string) => void }) {
  const t = useTranslations("report.page")
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(markdown)
          setState("copied")
          onAnnounce(t("copiedNote"))
        } catch {
          setState("failed")
          onAnnounce(t("copyFailed"))
        }
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setState("idle"), 2500)
      }}
    >
      {state === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
      {state === "copied" ? t("copied") : t("copy")}
    </Button>
  )
}
