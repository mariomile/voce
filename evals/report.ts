import { readFileSync } from "node:fs"
import type { LanguageModel } from "ai"
import type { Locale } from "@/i18n/locale"
import { isoDateOf } from "@/lib/format"
import { buildReportPrompt, reportValues, runReport, type RawReport, type ReportContent, type ReportIssue, type ReportSource } from "@/lib/report"
import { currentCommit, loadDataset, mapLimited, RESULTS, saveResult } from "./shared"

// The report eval (evals/report.json): one report call per case on a synthesis the harness builds from a dataset,
// the way getReportSource reads it from the database. Judged deterministically on the report after the app's
// checks; the hard checks (numbers, quotes, limits, forbidden, structure) must pass on every case, and at least
// 75% of the cases must pass every check.

type Stance = "for" | "against"
type HypothesisCase = {
  text: string
  verdict: "confirmed" | "refuted" | "to_review"
  reasoning: string
  for?: string[]
  against?: string[]
  for_topics?: string[]
  against_topics?: string[]
  against_count?: number
  for_ids?: "constraint_ids"
}

export type ReportCase = {
  id: string
  locale: Locale
  dataset: "ritmo" | "jira"
  question: string
  channel?: string
  themes?: Record<string, { title: string; kind: "problem" | "opportunity" | "praise" }>
  quote_ids?: Record<string, string[]>
  append?: Record<string, string>
  hypotheses: HypothesisCase[]
  expect_limits: string[]
  forbidden: string[]
  no_customer_words: boolean
}

type EvalFile = { threshold: { cases_passing_all_checks: number }; cases: ReportCase[] }

type Coverage = {
  constraint_ids: string[]
  feedback: { id: string; topic: string; text: string; channel: string; received_days_ago: number }[]
}

export function loadReportEval() {
  const file: EvalFile = JSON.parse(readFileSync("evals/report.json", "utf8"))
  return { cases: file.cases, threshold: file.threshold.cases_passing_all_checks }
}

const daysAgo = (days: number) => isoDateOf(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
// The first sentence of a feedback: the phrase the synthesis would highlight.
const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text

// The synthesis of a case, as the app reads it from the database after an analysis.
export function reportSourceOf(c: ReportCase): ReportSource {
  type Row = { id: string; text: string; channel: string; receivedAt: string; topic?: string }
  let feedback: Row[]
  let themes: { id: string; title: string; kind: "problem" | "opportunity" | "praise"; members: string[] }[]
  let constraintIds: string[] = []
  if (c.dataset === "ritmo") {
    const dataset = loadDataset()
    feedback = dataset.feedback.map((f) => ({ id: f.id, text: f.text, channel: f.channel, receivedAt: daysAgo(f.received_days_ago) }))
    themes = dataset.expected_themes.map((t, i) => ({
      id: `theme-${i + 1}`,
      title: t.title,
      kind: t.kind as "problem" | "opportunity" | "praise",
      members: t.feedback,
    }))
  } else {
    const coverage: Coverage = JSON.parse(readFileSync("evals/coverage.json", "utf8"))
    constraintIds = coverage.constraint_ids
    feedback = coverage.feedback.map((f) => ({
      id: f.id,
      text: f.text,
      channel: c.channel ?? f.channel,
      receivedAt: daysAgo(f.received_days_ago),
      topic: f.topic,
    }))
    themes = Object.entries(c.themes ?? {}).map(([topic, t]) => ({
      id: `theme-${topic}`,
      title: t.title,
      kind: t.kind,
      members: feedback.filter((f) => f.topic === topic).map((f) => f.id),
    }))
  }
  for (const [id, extra] of Object.entries(c.append ?? {})) {
    const f = feedback.find((x) => x.id === id)!
    f.text += extra
  }
  const byId = new Map(feedback.map((f) => [f.id, f]))
  const topicIds = (topics: string[] = []) => feedback.filter((f) => f.topic && topics.includes(f.topic)).map((f) => f.id)

  themes.sort((a, b) => b.members.length - a.members.length)
  const themeQuotes = new Map(
    themes.map((t) => {
      const chosen = c.quote_ids?.[t.title] ?? []
      const ids = [...chosen, ...t.members.filter((id) => !chosen.includes(id))].slice(0, 3)
      return [t.id, ids.map((id) => ({ feedbackId: id, highlight: firstSentence(byId.get(id)!.text) }))]
    })
  )

  const hypotheses = c.hypotheses.map((h, i) => {
    const forIds = h.for ?? (h.for_ids === "constraint_ids" ? constraintIds : topicIds(h.for_topics))
    const againstIds =
      h.against ?? (h.against_count ? topicIds(["f"]).slice(0, h.against_count) : topicIds(h.against_topics))
    return { id: `hypothesis-${i + 1}`, h, forIds, againstIds }
  })

  const sample = new Map<string, Row>()
  for (const t of themes) for (const q of themeQuotes.get(t.id)!) sample.set(q.feedbackId, byId.get(q.feedbackId)!)
  for (const { forIds, againstIds } of hypotheses)
    for (const id of [...forIds.slice(0, 3), ...againstIds.slice(0, 2)]) if (!sample.has(id)) sample.set(id, byId.get(id)!)

  const channels = new Map<string, number>()
  for (const f of feedback) channels.set(f.channel, (channels.get(f.channel) ?? 0) + 1)
  const dates = feedback.map((f) => f.receivedAt).sort()

  return {
    question: c.question,
    synthesis: { analysisId: "eval", createdAt: new Date().toISOString(), feedbackRead: feedback.length },
    feedbackTotal: feedback.length,
    arrivedAfter: 0,
    channels: [...channels].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    firstReceivedAt: dates[0],
    lastReceivedAt: dates.at(-1)!,
    themedCount: new Set(themes.flatMap((t) => t.members)).size,
    themes: themes.map((t) => ({
      id: t.id,
      title: t.title,
      kind: t.kind,
      summary: t.title,
      count: t.members.length,
      quotes: themeQuotes.get(t.id)!,
    })),
    hypotheses: hypotheses.map(({ id, h, forIds, againstIds }) => ({
      id,
      text: h.text,
      verdict: {
        value: h.verdict,
        reasoning: h.reasoning,
        supporting: forIds.length,
        contradicting: againstIds.length,
        feedbackRead: feedback.length,
      },
      quotes: [
        ...forIds.slice(0, 1).map((f) => ({ feedbackId: f, highlight: firstSentence(byId.get(f)!.text), stance: "for" as Stance })),
        ...againstIds.slice(0, 1).map((f) => ({ feedbackId: f, highlight: firstSentence(byId.get(f)!.text), stance: "against" as Stance })),
      ],
    })),
    sample: [...sample.values()].map((f) => ({
      feedbackId: f.id,
      text: f.text,
      channel: f.channel,
      receivedAt: f.receivedAt,
      themeIds: themes.filter((t) => t.members.includes(f.id)).map((t) => t.id),
      hypotheses: hypotheses.flatMap(({ id, forIds, againstIds }) =>
        forIds.includes(f.id) ? [{ id, stance: "for" as Stance }] : againstIds.includes(f.id) ? [{ id, stance: "against" as Stance }] : []
      ),
    })),
  }
}

// ===== The checks =====

// The texts of the report the model wrote, after the app's checks.
export function reportTexts(content: ReportContent) {
  return [
    ...content.summary,
    ...content.findings.flatMap((f) => [f.headline, f.why]),
    ...content.extraLimits,
    ...content.decisions.flatMap((d) => [d.title, d.why]),
  ]
}

const NUMBER = /(?<![\p{L}\p{N}])\p{N}+(?:[.,]\p{N}+)*(?![\p{L}\p{N}])/gu

// Numbers in the texts that the server did not compute.
export function numbersNotFromServer(texts: string[], source: ReportSource) {
  const allowed = new Set(Object.values(reportValues(source)).map((v) => v.replace("%", "")))
  return texts.flatMap((text) => [...text.matchAll(NUMBER)].map((m) => m[0]).filter((n) => !allowed.has(n)))
}

// Words with a capital letter inside a sentence that are nowhere in the data sent: invented names.
export function namesNotInData(texts: string[], data: string) {
  const known = data.toLowerCase()
  const names = new Set<string>()
  for (const text of texts)
    for (const sentence of text.split(/(?<=[.!?:;])\s+/)) {
      const words = sentence.split(/\s+/).slice(1)
      for (const raw of words) {
        const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
        if (word.length > 1 && /^\p{Lu}/u.test(word) && !known.includes(word.toLowerCase())) names.add(word)
      }
    }
  return [...names]
}

// A count written in words: a number word before who or what is counted, or a share ("metà", "half of"). "Le due
// ragioni" or "the two problems", pointing back to things the sentence names, is not a count of the data.
const NUMBER_WORDS =
  /(?<!\p{L})(?:(?:due|tre|quattro|cinque|sette|otto|nove|dieci|two|three|four|five|six|seven|eight|nine|ten)\s+(?:su|di|out|of|feedback|persone|palestre|team|aziende|utenti|clienti|people|gyms|teams|companies|users|customers)|metà|dozzina|half|dozen)(?!\p{L})/giu
export const numberWords = (texts: string[]) => texts.flatMap((t) => [...t.matchAll(NUMBER_WORDS)].map((m) => m[0]))

const PEOPLE_WORDS = /(?<!\p{L})(clienti|cliente|utenti|utente|customers?|users?)(?!\p{L})/giu
export const peopleWords = (texts: string[]) => texts.flatMap((t) => [...t.matchAll(PEOPLE_WORDS)].map((m) => m[0]))

const STOPWORDS: Record<Locale, Set<string>> = {
  it: new Set(["il", "lo", "la", "gli", "le", "che", "di", "del", "della", "per", "sono", "non", "una", "con", "è"]),
  en: new Set(["the", "and", "of", "is", "are", "with", "that", "for", "not", "they", "this"]),
}

// Share of the words that are stopwords of the other language.
export function otherLanguageShare(texts: string[], locale: Locale) {
  const other = STOPWORDS[locale === "it" ? "en" : "it"]
  const words = texts.join(" ").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean)
  return words.length === 0 ? 0 : words.filter((w) => other.has(w)).length / words.length
}

export type ReportCaseResult = {
  id: string
  locale: Locale
  passed: boolean
  hardPassed: boolean
  failures: string[]
  dropped: Record<string, number>
  content: ReportContent | null
  raw: RawReport | null
  issues: ReportIssue[]
  inputTokens?: number
  outputTokens?: number
  costUsd: number | null
  error?: string
}

export function judgeReport(c: ReportCase, source: ReportSource, content: ReportContent) {
  const hard: string[] = []
  const soft: string[] = []
  const texts = reportTexts(content)
  const shown = texts.join(" ").toLowerCase()

  const numbers = numbersNotFromServer(texts, source)
  if (numbers.length) hard.push(`numbers: ${numbers.join(", ")} not computed by the server`)

  for (const f of content.findings) {
    const theme = source.themes.find((t) => t.title === f.title)!
    for (const q of f.quotes) {
      const feedback = source.sample.find((s) => s.feedbackId === q.feedbackId)
      if (!feedback || !feedback.text.includes(q.highlight)) hard.push(`quotes: "${q.highlight}" not in its feedback`)
      else if (!feedback.themeIds.includes(theme.id)) hard.push(`quotes: ${q.feedbackId} not in theme "${f.title}"`)
    }
    if (f.quotes.length === 0) hard.push(`quotes: finding "${f.title}" without a quote`)
  }

  const keys = content.limits.map((l) => l.key as string)
  const missing = c.expect_limits.filter((k) => !keys.includes(k))
  if (missing.length) hard.push(`limits: missing ${missing.join(", ")}`)

  const forbidden = c.forbidden.filter((word) => shown.includes(word.toLowerCase()))
  if (forbidden.length) hard.push(`forbidden: ${forbidden.join(", ")}`)

  if (content.summary.length < 3 || content.summary.length > 5) hard.push(`structure: ${content.summary.length} summary sentences`)
  if (content.findings.length < 2) hard.push(`structure: ${content.findings.length} findings`)
  if (content.decisions.length < 2 || content.decisions.length > 4) hard.push(`structure: ${content.decisions.length} decisions`)

  const names = namesNotInData(texts, buildReportPrompt(source))
  if (names.length) soft.push(`entities: ${names.join(", ")}`)
  const words = numberWords(texts)
  if (words.length) soft.push(`number_words: ${words.join(", ")}`)
  if (c.no_customer_words) {
    const people = peopleWords(texts)
    if (people.length) soft.push(`people_words: ${people.join(", ")}`)
  }
  const share = otherLanguageShare(texts, c.locale)
  if (share > 0.03) soft.push(`language: ${(share * 100).toFixed(1)}% stopwords of the other language`)
  return { hard, soft }
}

// Stops the run: the account is out of credit or over its limit. Nothing else is worth retrying.
const USAGE_LIMIT = /usage limit|credit balance|rate limit|quota|429|billing/i

export async function runReportEvals({
  model,
  modelId,
  concurrency = 2,
}: {
  model: LanguageModel
  modelId: string
  concurrency?: number
}) {
  const { cases, threshold } = loadReportEval()
  let stopped = false
  const results = await mapLimited(cases, concurrency, async (c): Promise<ReportCaseResult> => {
    const source = reportSourceOf(c)
    const empty = { id: c.id, locale: c.locale, passed: false, hardPassed: false, dropped: {}, content: null, raw: null, issues: [], costUsd: null }
    if (stopped) return { ...empty, failures: ["not run: usage limit"] }
    try {
      const run = await runReport({ model, modelId, source, locale: c.locale })
      const { hard, soft } = judgeReport(c, source, run.content)
      const dropped: Record<string, number> = {}
      for (const issue of run.issues) dropped[issue.problem] = (dropped[issue.problem] ?? 0) + 1
      return {
        id: c.id,
        locale: c.locale,
        passed: hard.length === 0 && soft.length === 0,
        hardPassed: hard.length === 0,
        failures: [...hard, ...soft],
        dropped,
        content: run.content,
        raw: run.raw,
        issues: run.issues,
        inputTokens: run.inputTokens,
        outputTokens: run.outputTokens,
        costUsd: run.costUsd,
      }
    } catch (error) {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      if (USAGE_LIMIT.test(message)) stopped = true
      return { ...empty, failures: [`error: ${message.slice(0, 300)}`], error: message }
    }
  })
  const passing = results.filter((r) => r.passed).length
  const cost = results.reduce((sum, r) => sum + (r.costUsd ?? 0), 0)
  return {
    stopped,
    results,
    summary: {
      date: new Date().toISOString(),
      model: modelId,
      commit: currentCommit(),
      cases: results.length,
      passing,
      passRate: results.length ? passing / results.length : 0,
      threshold,
      hardFailed: results.filter((r) => !r.hardPassed).map((r) => r.id),
      dropped: results.reduce((sum, r) => sum + Object.values(r.dropped).reduce((a, b) => a + b, 0), 0),
      costUsd: Math.round(cost * 10_000) / 10_000,
      costPerReportUsd: results.length ? Math.round((cost / results.length) * 10_000) / 10_000 : 0,
    },
  }
}

export function saveReportResult(run: Awaited<ReturnType<typeof runReportEvals>>, dir = RESULTS) {
  return saveResult("report", { summary: run.summary, results: run.results }, dir)
}
