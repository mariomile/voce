import { expect, it } from "vitest"
import { analysisLanguageModel, analysisModel } from "@/lib/analysis"
import { runReportEvals, saveReportResult } from "./report"

// The report eval on evals/report.json with the real model: 4 calls, one per case. Passes with the hard checks
// (numbers, quotes, limits, forbidden, structure) on every case and at least 75% of the cases passing every
// check. Stops at a usage-limit error. Saves the run in evals/results/report-{date}.json and prints it next to
// the previous run, with the cost of each report.

it("report on the eval set", { timeout: 10 * 60_000 }, async () => {
  const run = await runReportEvals({ model: analysisLanguageModel(), modelId: analysisModel() })
  const { report } = saveReportResult(run)

  const lines = [`\nEval report, ${run.summary.model} @ ${run.summary.commit}. ${report}\n`]
  for (const r of run.results) {
    const cost = r.costUsd === null ? "?" : `$${r.costUsd.toFixed(4)}`
    lines.push(
      `  ${r.passed ? "✓" : r.hardPassed ? "~" : "✗"} ${r.id} (${r.locale}): ${cost}, ${r.inputTokens ?? "?"} in / ${r.outputTokens ?? "?"} out, scartati ${JSON.stringify(r.dropped)}`
    )
    for (const failure of r.failures) lines.push(`      ${failure}`)
  }
  console.log(lines.join("\n"))

  expect(run.stopped).toBe(false)
  expect(run.summary.hardFailed).toEqual([])
  expect(run.summary.passRate).toBeGreaterThanOrEqual(run.summary.threshold)
})
