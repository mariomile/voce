import { cn } from "cn"
import { Check, CircleHelp, X } from "lucide-react"
import { SectionHeading, StepNumber } from "@/components/page"
import { Stat } from "@/components/theme-row"
import { Badge } from "@/components/ui/badge"
import type { LatestReport } from "@/lib/data"
import { formatDate } from "@/lib/format"
import type { ReportContent } from "@/lib/report"
import { limitText, quoteParts, type ReportT } from "@/lib/report-format"

// The report as a document: the memo a PM sends to the team, in the language it was written in. Every number
// is the server's; every quote is a verified phrase of a feedback that still exists, rendered as text with the
// key phrase marked. data-report turns on the print stylesheet (globals.css): no app chrome, one column.
export function ReportDocument({ report, t }: { report: LatestReport; t: ReportT }) {
  const { content, locale } = report
  const date = (iso: string) => formatDate(iso, locale)
  return (
    <article data-report lang={locale} className="report-document">
      {/* On screen the question is already the title of the Research, above the tabs. */}
      <div className="mb-10 hidden print:block">
        <p className="mb-2 text-sm text-ink-muted">{t("eyebrow", { date: date(report.createdAt) })}</p>
        <h1 className="text-4xl leading-tight font-bold tracking-tight">{content.question}</h1>
      </div>

      <Section id="report-in-short" title={t("inShort")}>
        <div className="max-w-[62ch] pt-6">
          {content.summary.map((sentence, i) => (
            <p
              key={i}
              className={cn(
                i === 0
                  ? "mb-4 text-3xl leading-snug font-semibold tracking-snug text-balance"
                  : "mb-3 text-xl leading-relaxed text-ink"
              )}
            >
              {sentence}
            </p>
          ))}
        </div>
      </Section>

      <Section id="report-findings" title={t("findings")} lede={t("findingsLede", { read: content.synthesis.feedbackRead })}>
        {content.findings.map((finding, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-4 border-b border-line py-8 last:border-b-0 sm:grid-cols-[148px_1fr] sm:gap-8 print:break-inside-avoid"
          >
            <div className="flex items-end gap-4 sm:block">
              <Stat value={finding.count} label={t("feedbackLabel")} />
              <p className="text-sm text-ink-muted tabular-nums sm:mt-2">{t("share", { share: finding.share })}</p>
            </div>
            <div>
              <Badge variant={finding.kind}>{t(`kind.${finding.kind}`)}</Badge>
              <h3 className="my-2 max-w-[48ch] text-2xl leading-snug font-bold tracking-snug">{finding.title}</h3>
              <p className="max-w-[64ch] text-lg leading-relaxed">{finding.headline}</p>
              <p className="mt-1 max-w-[64ch] text-base leading-relaxed text-ink-muted">{finding.why}</p>
              <Quotes quotes={finding.quotes} report={report} t={t} />
            </div>
          </div>
        ))}
      </Section>

      <Section id="report-hypotheses" title={t("hypotheses")}>
        {content.hypotheses.length === 0 && <p className="py-6 text-base text-ink-muted">{t("hypothesesNone")}</p>}
        <ul>
          {content.hypotheses.map((h, i) => (
            <li
              key={i}
              className="grid grid-cols-1 gap-4 border-b border-line py-8 last:border-b-0 sm:grid-cols-[148px_1fr] sm:gap-8 print:break-inside-avoid"
            >
              <div>
                <VerdictWord hypothesis={h} t={t} />
              </div>
              <div>
                <h3 className="max-w-[48ch] text-2xl leading-snug font-bold tracking-snug">{h.text}</h3>
                <p className="mt-2 max-w-[64ch] text-base leading-relaxed text-ink-muted">
                  {h.verdict ? h.reasoning : t("noVerdict")}
                </p>
                {h.quotes.length > 0 && (
                  <div className={cn("grid grid-cols-1 gap-x-10", h.quotes.length > 1 && "lg:grid-cols-2 print:grid-cols-1")}>
                    {h.quotes.map((q) => (
                      <Quotes
                        key={q.feedbackId + q.stance}
                        quotes={[q]}
                        report={report}
                        t={t}
                        label={t(q.stance === "for" ? "inFavour" : "against")}
                      />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="report-unknowns" title={t("unknowns")}>
        <ul className="max-w-[72ch] list-disc space-y-2 py-6 pl-5 text-lg leading-relaxed marker:text-ink-subtle">
          {content.limits.map((limit) => (
            <li key={limit.key}>{limitText(limit, t, locale)}</li>
          ))}
          {content.extraLimits.map((limit, i) => (
            <li key={i}>{limit}</li>
          ))}
        </ul>
      </Section>

      <Section id="report-decisions" title={t("decisions")} lede={t("decisionsNote")}>
        <ol>
          {content.decisions.map((d, i) => (
            <li
              key={i}
              className="grid grid-cols-[32px_1fr] gap-4 border-b border-line py-6 last:border-b-0 sm:gap-6 print:break-inside-avoid"
            >
              <StepNumber step={i + 1} />
              <div>
                <h3 className="max-w-[56ch] text-xl leading-snug font-bold">{d.title}</h3>
                <p className="mt-1 max-w-[64ch] text-base leading-relaxed text-ink-muted">{d.why}</p>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{t("evidence")}</span>
                  {d.evidence.map((e, j) => (
                    <Badge key={j} className="font-normal">
                      {e.kind === "theme"
                        ? t("evidenceTheme", { title: e.title, count: e.count })
                        : t("evidenceHypothesis", { text: e.text, verdict: t(`verdict.${e.verdict ?? "none"}`) })}
                    </Badge>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <p className="mt-12 max-w-[72ch] border-t border-line pt-4 text-sm text-ink-muted">
        {t("footer", { date: date(report.createdAt), count: report.feedbackCount })}
      </p>
    </article>
  )
}

function Section({ id, title, lede, children }: { id: string; title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mb-14 print:mb-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-ink pb-4 print:break-after-avoid">
        <SectionHeading id={id}>{title}</SectionHeading>
        {lede && <p className="max-w-[64ch] text-base text-ink-muted">{lede}</p>}
      </div>
      {children}
    </section>
  )
}

// The verified quotes of a finding or a side of a verdict. A feedback deleted after the report is left out.
function Quotes({
  quotes,
  report,
  t,
  label,
}: {
  quotes: { feedbackId: string; highlight: string }[]
  report: LatestReport
  t: ReportT
  label?: string
}) {
  const shown = quotes.flatMap((q) => {
    const feedback = report.feedback[q.feedbackId]
    return feedback ? [{ ...q, feedback }] : []
  })
  if (shown.length === 0) return null
  return (
    <div className="mt-5 flex flex-col gap-4">
      {label && <p className="-mb-2 text-md font-semibold">{label}</p>}
      {shown.map(({ feedbackId, highlight, feedback }) => {
        const parts = quoteParts(feedback.text, highlight)
        return (
          <blockquote key={feedbackId} className="m-0 max-w-[58ch] font-serif text-xl leading-relaxed font-normal">
            “{parts.before}
            {parts.highlight && <mark>{parts.highlight}</mark>}
            {parts.after}”
            <cite className="mt-1 block font-sans text-sm text-ink-muted not-italic">
              {t("quoteSource", { channel: feedback.channel, date: formatDate(feedback.receivedAt, report.locale) })}
            </cite>
          </blockquote>
        )
      })}
    </div>
  )
}

// The answer of a hypothesis, as in the Sintesi: the word in the heaviest type, the sign decorative.
const WORDS = { confirmed: Check, refuted: X, to_review: CircleHelp } as const

function VerdictWord({ hypothesis, t }: { hypothesis: ReportContent["hypotheses"][number]; t: ReportT }) {
  const kind = hypothesis.verdict
  const Icon = kind ? WORDS[kind] : CircleHelp
  const muted = !kind || kind === "to_review"
  return (
    <div className="flex items-center gap-3 sm:block">
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full sm:mb-2",
          muted ? "bg-veil text-ink-muted" : "bg-ink text-highlight"
        )}
      >
        <Icon className="size-5" strokeWidth={3} />
      </span>
      <div>
        <p className={cn("text-2xl leading-tight font-black tracking-tight", muted && "font-extrabold text-ink-muted")}>
          {t(`verdict.${kind ?? "none"}`)}
        </p>
        {kind && (
          <p className="mt-1 text-sm text-ink-muted tabular-nums">
            {t("counts", {
              supporting: hypothesis.supporting,
              contradicting: hypothesis.contradicting,
              read: hypothesis.feedbackRead,
            })}
          </p>
        )}
      </div>
    </div>
  )
}
