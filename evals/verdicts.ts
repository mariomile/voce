import { readFileSync } from "node:fs"
import type { LanguageModel } from "ai"
import type { Locale } from "@/i18n/locale"
import {
  runVerdict,
  type CheckedVerdict,
  type RawVerdictOutput,
  type VerdictFeedback,
  type VerdictHypothesis,
} from "@/lib/verdict"
import { currentCommit, datasetFeedback, loadDataset, mapLimited, quotedSpans, RESULTS, saveResult, type Dataset } from "./shared"

// The verdict eval (evals/verdicts.json): one verdict call per case, judged deterministically. Case checks
// read the output after the app's checks (checkVerdicts); G1 reads the raw model output. A run passes with
// at least 85% of the cases passing all their checks, every must-pass case passing and G1 at 0 violations.

type Expected = {
  text: string
  verdict: string | string[]
  for_allowed?: string[]
  against_allowed?: string[]
  min_for_links?: number
  min_for_quotes?: number
  min_against_quotes?: number
  max_quotes?: number
  forbidden?: string[]
  forbidden_links?: string[]
}

export type VerdictCase = {
  id: string
  kind: string
  note?: string
  locale?: Locale
  feedback?: string[]
  extra_feedback?: { id: string; channel: string; received_at: string; text: string }[]
  hypotheses: Expected[]
  rubric?: string
  must_pass: boolean
}

type EvalFile = { threshold: { cases_passing_all_checks: number }; cases: VerdictCase[] }

export function loadVerdictEval() {
  const file: EvalFile = JSON.parse(readFileSync("evals/verdicts.json", "utf8"))
  return { cases: file.cases, threshold: file.threshold.cases_passing_all_checks, dataset: loadDataset() }
}

// G3: a count of feedback or customers written as digits.
const COUNT = /\b\d+\s+(feedback|clienti|utenti|persone|iscritti|segnalazioni|customers|users)\b/i

// The call of a case: its hypotheses (written before every feedback entered Voce) and the feedback of the
// dataset (or the subset it names), plus its extra feedback at the end.
export function caseInput(c: VerdictCase, dataset: Dataset) {
  const all = datasetFeedback(dataset)
  const base = c.feedback ? all.filter((f) => c.feedback!.includes(f.id)) : all
  const enteredAt = new Date().toISOString()
  const feedback: VerdictFeedback[] = [
    ...base.map((f) => ({ ...f, createdAt: enteredAt })),
    ...(c.extra_feedback ?? []).map((f) => ({ id: f.id, text: f.text, channel: f.channel, receivedAt: f.received_at, createdAt: enteredAt })),
  ]
  const hypotheses: VerdictHypothesis[] = c.hypotheses.map((h, i) => ({ id: `h${i + 1}`, text: h.text, writtenAt: "2020-01-01T00:00:00Z" }))
  return { hypotheses, feedback, locale: c.locale ?? "it" }
}

// Every check of a case, as a list of failures (empty: the case passes). g1Violations counts the raw quotes
// that are not an exact substring of the feedback they name.
export function judgeCase(
  c: VerdictCase,
  input: ReturnType<typeof caseInput>,
  raw: RawVerdictOutput,
  verdicts: CheckedVerdict[]
) {
  const failures: string[] = []
  const { feedback } = input

  let g1Violations = 0
  for (const entry of raw.hypotheses)
    for (const quote of entry.quotes) {
      const source = feedback[quote.feedback - 1]
      if (!source || !quote.text.trim() || !source.text.includes(quote.text.trim())) {
        g1Violations++
        failures.push(`G1: raw quote not in feedback ${quote.feedback}: "${quote.text}"`)
      }
    }

  c.hypotheses.forEach((expected, i) => {
    const label = `h${i + 1}`
    const found = verdicts.filter((v) => v.hypothesisId === label)
    if (found.length !== 1) {
      failures.push(`G5: ${label} has ${found.length} verdicts`)
      return
    }
    const v = found[0]
    const forQuotes = v.quotes.filter((q) => q.stance === "for")
    const againstQuotes = v.quotes.filter((q) => q.stance === "against")
    const linked = (stance: "for" | "against") => v.links.filter((l) => l.stance === stance).map((l) => l.feedbackId)

    if (v.verdict === "confirmed" && forQuotes.length === 0) failures.push(`G5: ${label} confirmed without a quote for`)
    if (v.verdict === "refuted" && againstQuotes.length === 0) failures.push(`G5: ${label} refuted without a quote against`)
    if (forQuotes.length > 3 || againstQuotes.length > 2) failures.push(`G4: ${label} has too many quotes`)
    if (new Set(v.quotes.map((q) => q.feedbackId)).size !== v.quotes.length) failures.push(`G4: ${label} quotes a feedback twice`)
    if (linked("for").some((f) => linked("against").includes(f))) failures.push(`G4: ${label} links a feedback on both sides`)

    for (const span of quotedSpans(v.reasoning))
      if (!feedback.some((f) => f.text.includes(span))) failures.push(`G2: ${label} quotes "${span}", not in any feedback`)
    if (COUNT.test(v.reasoning)) failures.push(`G3: ${label} writes a count in the reasoning`)

    const accepted = Array.isArray(expected.verdict) ? expected.verdict : [expected.verdict]
    if (!accepted.includes(v.verdict)) failures.push(`verdict: ${label} is ${v.verdict}, expected ${accepted.join(" or ")}`)
    for (const [stance, allowed] of [["for", expected.for_allowed], ["against", expected.against_allowed]] as const)
      if (allowed)
        for (const f of linked(stance))
          if (!allowed.includes(f)) failures.push(`${stance}_allowed: ${label} links ${f} ${stance}`)
    if (expected.min_for_links !== undefined && linked("for").length < expected.min_for_links)
      failures.push(`min_for_links: ${label} links ${linked("for").length} for, expected at least ${expected.min_for_links}`)
    if (expected.min_for_quotes !== undefined && forQuotes.length < expected.min_for_quotes)
      failures.push(`min_for_quotes: ${label} has ${forQuotes.length}`)
    if (expected.min_against_quotes !== undefined && againstQuotes.length < expected.min_against_quotes)
      failures.push(`min_against_quotes: ${label} has ${againstQuotes.length}`)
    if (expected.max_quotes !== undefined && v.quotes.length > expected.max_quotes)
      failures.push(`max_quotes: ${label} has ${v.quotes.length}`)
    for (const word of expected.forbidden ?? [])
      if (v.reasoning.toLowerCase().includes(word.toLowerCase())) failures.push(`forbidden "${word}" in the reasoning of ${label}`)
    for (const f of expected.forbidden_links ?? [])
      if (v.links.some((l) => l.feedbackId === f)) failures.push(`forbidden link ${f} on ${label}`)
  })
  return { failures, g1Violations }
}

export type CaseResult = {
  id: string
  mustPass: boolean
  locale: Locale
  passed: boolean
  failures: string[]
  g1Violations: number
  verdicts: { hypothesis: string; verdict: string; reasoning: string; quotes: number }[]
  issues: unknown[]
  raw: RawVerdictOutput | null
  inputTokens?: number
  outputTokens?: number
  costUsd: number | null
}

export async function runVerdictEvals({
  model,
  modelId,
  concurrency = 4,
}: {
  model: LanguageModel
  modelId: string
  concurrency?: number
}) {
  const { cases, threshold, dataset } = loadVerdictEval()
  const results = await mapLimited(cases, concurrency, async (c): Promise<CaseResult> => {
    const input = caseInput(c, dataset)
    const base = { id: c.id, mustPass: c.must_pass, locale: input.locale }
    try {
      const run = await runVerdict({ model, modelId, ...input })
      const { failures, g1Violations } = judgeCase(c, input, run.raw, run.verdicts)
      return {
        ...base,
        passed: failures.length === 0,
        failures,
        g1Violations,
        verdicts: run.verdicts.map((v) => ({ hypothesis: v.hypothesisId, verdict: v.verdict, reasoning: v.reasoning, quotes: v.quotes.length })),
        issues: run.issues,
        raw: run.raw,
        inputTokens: run.inputTokens,
        outputTokens: run.outputTokens,
        costUsd: run.costUsd,
      }
    } catch (error) {
      // Only the error name: a message can carry the prompt.
      const name = error instanceof Error ? error.name : "unknown"
      return { ...base, passed: false, failures: [`error: ${name}`], g1Violations: 0, verdicts: [], issues: [], raw: null, costUsd: null }
    }
  })

  const passed = results.filter((r) => r.passed).length
  const mustPassFailed = results.filter((r) => r.mustPass && !r.passed).map((r) => r.id)
  const g1Violations = results.reduce((sum, r) => sum + r.g1Violations, 0)
  const passRate = passed / results.length
  const summary = {
    model: modelId,
    commit: currentCommit(),
    date: new Date().toISOString(),
    cases: results.length,
    passed,
    passRate,
    threshold,
    mustPassFailed,
    g1Violations,
    ok: passRate >= threshold && mustPassFailed.length === 0 && g1Violations === 0,
    inputTokens: results.reduce((sum, r) => sum + (r.inputTokens ?? 0), 0),
    outputTokens: results.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0),
    costUsd: Math.round(results.reduce((sum, r) => sum + (r.costUsd ?? 0), 0) * 10_000) / 10_000,
  }
  return { results, summary }
}

export function saveVerdictResult(run: Awaited<ReturnType<typeof runVerdictEvals>>, dir = RESULTS, date = new Date()) {
  return saveResult("verdicts", { summary: run.summary, cases: run.results }, dir, date)
}
