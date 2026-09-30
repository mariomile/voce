import type { Locale } from "@/i18n/locale"
import type { LatestReport } from "./data"
import { formatDate } from "./format"
import type { ReportLimit } from "./report"

// How a saved report reads: its quotes cut to the key phrase, its limits in words, the whole memo as markdown
// for "Copia come testo". Pure functions, in the language the report was written in.

// A translator of the report.document messages, as a plain function.
export type ReportT = (key: string, values?: Record<string, string | number>) => string

export function reportT(t: (key: never, values?: never) => string): ReportT {
  return (key, values) => t(key as never, values as never)
}

// Up to this length a feedback is shown whole; a longer one shows its key phrase, with the ellipses.
const WHOLE_UP_TO = 200

// The ellipsis after a key phrase cut from a longer feedback. None when the phrase ends its sentence.
const tail = (highlight: string, cut: boolean) => (cut && !/[.!?…]["”»)]?$/.test(highlight.trim()) ? "…" : "")

export function quoteParts(text: string, highlight: string) {
  const at = text.indexOf(highlight)
  if (at < 0) return { before: text, highlight: "", after: "" }
  const end = at + highlight.length
  if (text.length <= WHOLE_UP_TO) return { before: text.slice(0, at), highlight, after: text.slice(end) }
  return { before: at > 0 ? "…" : "", highlight, after: tail(highlight, end < text.length) }
}

// A limit of the report in words. Dates in the language of the report.
export function limitText(limit: ReportLimit, t: ReportT, locale: Locale) {
  const values = { ...limit.values }
  for (const key of ["date", "start", "end"])
    if (typeof values[key] === "string") values[key] = formatDate(values[key] as string, locale)
  return t(`limits.${limit.key}`, values)
}

const verdictLabel = (t: ReportT, verdict: string | null) => t(`verdict.${verdict ?? "none"}`)

// The memo as markdown: headings, the numbers the server wrote, the quotes of feedback that still exist.
export function reportMarkdown(report: LatestReport, t: ReportT) {
  const { content, locale, feedback } = report
  const date = (iso: string) => formatDate(iso, locale)
  const quote = (feedbackId: string, highlight: string, prefix = "") => {
    const f = feedback[feedbackId]
    if (!f) return []
    // One line: a feedback with line breaks would leave the blockquote, or add headings to the memo.
    const parts = quoteParts(f.text.replace(/\s*\n\s*/g, " "), highlight.replace(/\s*\n\s*/g, " "))
    return [`> ${prefix}“${parts.before}${parts.highlight}${parts.after}” (${t("quoteSource", { channel: f.channel, date: date(f.receivedAt) })})`, ""]
  }
  const lines = [
    `# ${t("markdownTitle", { question: content.question })}`,
    "",
    `_${t("eyebrow", { date: date(report.createdAt) })}_`,
    "",
    `## ${t("inShort")}`,
    "",
    ...content.summary.flatMap((s) => [s, ""]),
    `## ${t("findings")}`,
    "",
  ]
  for (const f of content.findings) {
    lines.push(
      `### ${f.title}`,
      "",
      [t(`kind.${f.kind}`), `${f.count} ${t("feedbackLabel")}`, t("share", { share: f.share })].join(" · "),
      "",
      `${f.headline} ${f.why}`,
      "",
      ...f.quotes.flatMap((q) => quote(q.feedbackId, q.highlight))
    )
  }
  lines.push(`## ${t("hypotheses")}`, "")
  if (content.hypotheses.length === 0) lines.push(t("hypothesesNone"), "")
  for (const h of content.hypotheses) {
    lines.push(`### ${h.text}: ${verdictLabel(t, h.verdict)}`, "")
    if (!h.verdict) {
      lines.push(t("noVerdict"), "")
      continue
    }
    lines.push(t("counts", { supporting: h.supporting, contradicting: h.contradicting, read: h.feedbackRead }), "")
    if (h.reasoning) lines.push(h.reasoning, "")
    for (const q of h.quotes) lines.push(...quote(q.feedbackId, q.highlight, `${t(q.stance === "for" ? "inFavour" : "against")}: `))
  }
  lines.push(
    `## ${t("unknowns")}`,
    "",
    ...content.limits.map((l) => `- ${limitText(l, t, locale)}`),
    ...content.extraLimits.map((l) => `- ${l}`),
    "",
    `## ${t("decisions")}`,
    "",
    `_${t("decisionsNote")}_`,
    "",
    ...content.decisions.map((d, i) => {
      const evidence = d.evidence
        .map((e) =>
          e.kind === "theme"
            ? t("evidenceTheme", { title: e.title, count: e.count })
            : t("evidenceHypothesis", { text: e.text, verdict: verdictLabel(t, e.verdict) })
        )
        .join("; ")
      return `${i + 1}. **${d.title.replace(/[.!?]+$/, "")}.** ${d.why} ${t("evidence")}: ${evidence}.`
    }),
    "",
    "---",
    "",
    `_${t("footer", { date: date(report.createdAt), count: content.synthesis.feedbackRead })}_`
  )
  return lines.join("\n")
}
