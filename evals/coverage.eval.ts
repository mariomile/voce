import { expect, it } from "vitest"
import { analysisLanguageModel, analysisModel, runAnalysis } from "@/lib/analysis"
import { runVerdict } from "@/lib/verdict"
import { coverageFeedback, coverageHypotheses, judgeThemes, judgeVerdicts, loadCoverageEval } from "./coverage"
import { currentCommit, saveResult } from "./shared"

// The coverage eval on evals/coverage.json with the real model: one themes call and one verdict call on the
// 200 feedback of the Jira Research, run together. Passes with coverage of the on-topic feedback at least 0.9,
// no praise theme made of constraints, "Jira è lento" linking at least 85% of the slow feedback and the roadmap
// hypothesis at least 12 feedback for. Saves the run in evals/results/coverage-{date}.json.

it("coverage on the Jira Research", { timeout: 10 * 60_000 }, async () => {
  const file = loadCoverageEval()
  const feedback = coverageFeedback(file)
  const modelId = analysisModel()
  const model = analysisLanguageModel()

  const [themes, verdict] = await Promise.all([
    runAnalysis({ model, modelId, feedback, existingTitles: [] }),
    runVerdict({ model, modelId, hypotheses: coverageHypotheses(file), feedback }),
  ])
  const t = judgeThemes(file, themes.themes)
  const v = judgeVerdicts(file, verdict.verdicts)

  const summary = {
    model: modelId,
    commit: currentCommit(),
    date: new Date().toISOString(),
    themes: themes.themes.length,
    coverage: t.coverage,
    unthemedOnTopic: t.unthemed.length,
    offTopicThemed: t.offTopicThemed,
    constraintsAsPraise: t.constraintsAsPraise.length,
    slowRecall: v.slowRecall,
    discoveryFor: v.discoveryFor,
    // Summaries and reasoning that call who wrote "clienti" or "customers": the Research is about a tool.
    customerWords: [...themes.themes.map((x) => x.summary), ...verdict.verdicts.map((x) => x.reasoning)].filter((text) =>
      /\b(client[ei]|customers?)\b/i.test(text)
    ).length,
    verdictCounts: v.counts.map((c) => `${c.verdict} ${c.for}/${c.against}`),
    themesIssues: themes.issues.length,
    verdictIssues: verdict.issues.length,
    themesDurationMs: themes.durationMs,
    verdictDurationMs: verdict.durationMs,
    themesCostUsd: themes.costUsd,
    verdictCostUsd: verdict.costUsd,
    costUsd: Math.round(((themes.costUsd ?? 0) + (verdict.costUsd ?? 0)) * 10_000) / 10_000,
  }
  const { report } = saveResult("coverage", {
    summary,
    topics: t.topics,
    unthemed: t.unthemed,
    constraintsAsPraise: t.constraintsAsPraise,
    verdicts: v.counts,
    themes: themes.themes.map((x) => ({ title: x.title, kind: x.kind, sentiment: x.sentiment, feedback: x.feedback.length })),
    themesIssues: themes.issues,
    verdictIssues: verdict.issues,
    themesOutput: themes.raw,
    verdictOutput: verdict.raw,
  })

  const lines = [`\nEval copertura, ${modelId} @ ${summary.commit}. ${report}\n`, "  Temi:"]
  for (const x of [...themes.themes].sort((a, b) => b.feedback.length - a.feedback.length))
    lines.push(`    ${x.feedback.length}  [${x.kind}, ${x.sentiment}] ${x.title}`)
  lines.push("\n  Argomenti (totale, in un tema, nel tema principale):")
  for (const [topic, n] of Object.entries(t.topics)) lines.push(`    ${topic}: ${n.total}, ${n.themed}, ${n.bestTheme}`)
  for (const x of t.constraintsAsPraise) lines.push(`  ✗ vincoli come apprezzamento: ${x.title} (${x.constraints} su ${x.size})`)
  lines.push("\n  Verdetti:")
  for (const c of v.counts) lines.push(`    ${c.verdict} ${c.for} a favore, ${c.against} contro: ${c.text}`)
  lines.push("\n  Fuori da ogni tema:")
  for (const u of t.unthemed) lines.push(`    ${u.topic} ${u.text.slice(0, 90)}`)
  console.log(lines.join("\n"))

  expect(t.coverage).toBeGreaterThanOrEqual(file.threshold.coverage)
  expect(t.constraintsAsPraise).toEqual([])
  expect(v.slowRecall).toBeGreaterThanOrEqual(file.threshold.slow_recall)
  expect(v.discoveryFor).toBeGreaterThanOrEqual(file.threshold.discovery_for_min)
})
