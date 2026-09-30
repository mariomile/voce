import { readFileSync } from "node:fs"
import type { CheckedTheme } from "@/lib/analysis"
import type { CheckedVerdict, VerdictFeedback, VerdictHypothesis } from "@/lib/verdict"
import { isoDateOf } from "@/lib/format"

// The coverage eval (evals/coverage.json): the 200 feedback of the Jira Research, one themes call and one
// verdict call. It measures what the synthetic set of 60 is too small to show: how many on-topic feedback end
// up in no theme, whether a constraint is sold as praise, and whether the counts next to a verdict count every
// feedback on that side or only a sample. Checks read the output after the app's checks.

export type CoverageFeedback = { id: string; topic: string; text: string; channel: string; received_days_ago: number }

export type CoverageEval = {
  research_question: string
  threshold: { coverage: number; constraints_as_praise: number; slow_recall: number; discovery_for_min: number }
  constraint_ids: string[]
  slow_ids: string[]
  hypotheses: string[]
  feedback: CoverageFeedback[]
}

export function loadCoverageEval(): CoverageEval {
  return JSON.parse(readFileSync("evals/coverage.json", "utf8"))
}

// Newest first, like the app reads them.
export function coverageFeedback(file: CoverageEval): VerdictFeedback[] {
  const enteredAt = new Date().toISOString()
  return [...file.feedback].sort((a, b) => a.received_days_ago - b.received_days_ago).map((f) => ({
    id: f.id,
    text: f.text,
    channel: f.channel,
    receivedAt: isoDateOf(new Date(Date.now() - f.received_days_ago * 24 * 60 * 60 * 1000)),
    createdAt: enteredAt,
  }))
}

export function coverageHypotheses(file: CoverageEval): VerdictHypothesis[] {
  return file.hypotheses.map((text, i) => ({ id: `h${i + 1}`, text, writtenAt: "2020-01-01T00:00:00Z" }))
}

// The themes part: coverage of the on-topic feedback, per topic too (in any theme, and in the one theme that
// holds most of the topic), and the praise themes made of constraints.
export function judgeThemes(file: CoverageEval, themes: Pick<CheckedTheme, "title" | "kind" | "feedback">[]) {
  const themed = new Set(themes.flatMap((t) => t.feedback))
  const onTopic = file.feedback.filter((f) => f.topic !== "off_topic")
  const unthemed = onTopic.filter((f) => !themed.has(f.id))
  const coverage = Math.round((1 - unthemed.length / onTopic.length) * 1000) / 1000

  const topics: Record<string, { total: number; themed: number; bestTheme: number }> = {}
  for (const topic of [...new Set(onTopic.map((f) => f.topic))].sort()) {
    const ids = onTopic.filter((f) => f.topic === topic).map((f) => f.id)
    topics[topic] = {
      total: ids.length,
      themed: ids.filter((id) => themed.has(id)).length,
      bestTheme: Math.max(0, ...themes.map((t) => t.feedback.filter((id) => ids.includes(id)).length)),
    }
  }

  const constraints = new Set(file.constraint_ids)
  const constraintsAsPraise = themes
    .filter((t) => t.kind === "praise")
    .map((t) => ({ title: t.title, constraints: t.feedback.filter((id) => constraints.has(id)).length, size: t.feedback.length }))
    .filter((t) => t.constraints >= 3 || t.constraints / t.size >= 0.4)

  const offTopicThemed = file.feedback.filter((f) => f.topic === "off_topic" && themed.has(f.id)).length
  return { coverage, unthemed: unthemed.map((f) => ({ id: f.id, topic: f.topic, text: f.text })), topics, constraintsAsPraise, offTopicThemed }
}

// The verdict part: the counts of each hypothesis, and how many of the slow feedback "Jira è lento" links for.
export function judgeVerdicts(file: CoverageEval, verdicts: CheckedVerdict[]) {
  const counts = file.hypotheses.map((text, i) => {
    const v = verdicts.find((x) => x.hypothesisId === `h${i + 1}`)
    return {
      text,
      verdict: v?.verdict ?? null,
      for: v?.links.filter((l) => l.stance === "for").length ?? 0,
      against: v?.links.filter((l) => l.stance === "against").length ?? 0,
    }
  })
  const slow = verdicts.find((v) => v.hypothesisId === `h${file.hypotheses.indexOf("Jira è lento") + 1}`)
  const slowFor = new Set(slow?.links.filter((l) => l.stance === "for").map((l) => l.feedbackId) ?? [])
  const slowRecall = Math.round((file.slow_ids.filter((id) => slowFor.has(id)).length / file.slow_ids.length) * 1000) / 1000
  const discovery = counts.find((c) => c.text.startsWith("La roadmap e la discovery"))
  return { counts, slowRecall, discoveryFor: discovery?.for ?? 0 }
}
