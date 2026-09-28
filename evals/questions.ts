import { readFileSync } from "node:fs"
import type { LanguageModel } from "ai"
import { runQuestion, type RawAnswer } from "@/lib/questions"
import { currentCommit, datasetFeedback, loadDataset, mapLimited, quotedSpans, RESULTS, saveResult } from "./shared"

// The Chiedi eval (evals/questions.json): one question per case against the 60 feedback of the dataset,
// judged deterministically. G1 reads the raw model output; the other checks the output after the app's
// checks (checkAnswer). A run passes with at least 85% of the cases passing all their checks, every
// must-pass case passing and G1 at 0 violations. G5 (sentences in the answer) is reported only.

export type QuestionCase = {
  id: string
  kind: string
  question: string
  outcome: "answered" | "no_evidence" | "any"
  relevant: string[]
  forbidden: string[]
  must_pass: boolean
  note?: string
  rubric?: string
}

type EvalFile = { threshold: { cases_passing_all_checks: number }; cases: QuestionCase[] }

export function loadQuestionEval() {
  const file: EvalFile = JSON.parse(readFileSync("evals/questions.json", "utf8"))
  return { cases: file.cases, threshold: file.threshold.cases_passing_all_checks, dataset: loadDataset() }
}

// G3: a count of feedback or customers written as digits.
const COUNT = /\b\d+\s+(feedback|clienti|utenti|persone|iscritti|segnalazioni)\b/i

export type QuestionCaseResult = {
  id: string
  mustPass: boolean
  passed: boolean
  failures: string[]
  g1Violations: number
  sentences: number
  answer: string
  quotes: number
  issues: unknown[]
  raw: RawAnswer | null
  inputTokens?: number
  outputTokens?: number
  costUsd: number | null
}

export async function runQuestionEvals({
  model,
  modelId,
  concurrency = 4,
}: {
  model: LanguageModel
  modelId: string
  concurrency?: number
}) {
  const { cases, threshold, dataset } = loadQuestionEval()
  const feedback = datasetFeedback(dataset)
  const results = await mapLimited(cases, concurrency, async (c): Promise<QuestionCaseResult> => {
    const base = { id: c.id, mustPass: c.must_pass }
    try {
      const run = await runQuestion({ model, modelId, question: c.question, feedback })
      const failures: string[] = []
      let g1Violations = 0
      for (const quote of run.raw.quotes) {
        const source = feedback[quote.feedback - 1]
        if (!source || !quote.text.trim() || !source.text.includes(quote.text.trim())) {
          g1Violations++
          failures.push(`G1: raw quote not in feedback ${quote.feedback}: "${quote.text}"`)
        }
      }
      for (const span of quotedSpans(run.answer))
        if (!feedback.some((f) => f.text.includes(span))) failures.push(`G2: "${span}" is not in any feedback`)
      if (COUNT.test(run.answer)) failures.push("G3: a count in the answer")
      if (run.quotes.length > 5 || new Set(run.quotes.map((q) => q.feedbackId)).size !== run.quotes.length)
        failures.push("G4: more than 5 quotes or two of one feedback")
      if (c.outcome === "answered") {
        if (run.quotes.length === 0) failures.push("answered: no verified quote")
        for (const q of run.quotes) if (!c.relevant.includes(q.feedbackId)) failures.push(`relevant: quote from ${q.feedbackId}`)
      }
      if (c.outcome === "no_evidence" && run.quotes.length > 0) failures.push(`no_evidence: ${run.quotes.length} verified quotes`)
      for (const word of c.forbidden)
        if (run.answer.toLowerCase().includes(word.toLowerCase())) failures.push(`forbidden "${word}" in the answer`)
      return {
        ...base,
        passed: failures.length === 0,
        failures,
        g1Violations,
        sentences: run.answer.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim()).length,
        answer: run.answer,
        quotes: run.quotes.length,
        issues: run.issues,
        raw: run.raw,
        inputTokens: run.inputTokens,
        outputTokens: run.outputTokens,
        costUsd: run.costUsd,
      }
    } catch (error) {
      // Only the error name: a message can carry the prompt.
      const name = error instanceof Error ? error.name : "unknown"
      return { ...base, passed: false, failures: [`error: ${name}`], g1Violations: 0, sentences: 0, answer: "", quotes: 0, issues: [], raw: null, costUsd: null }
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
    answersOverThreeSentences: results.filter((r) => r.sentences > 3).length,
    inputTokens: results.reduce((sum, r) => sum + (r.inputTokens ?? 0), 0),
    outputTokens: results.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0),
    costUsd: Math.round(results.reduce((sum, r) => sum + (r.costUsd ?? 0), 0) * 10_000) / 10_000,
  }
  return { results, summary }
}

export function saveQuestionResult(run: Awaited<ReturnType<typeof runQuestionEvals>>, dir = RESULTS, date = new Date()) {
  return saveResult("questions", { summary: run.summary, cases: run.results }, dir, date)
}
