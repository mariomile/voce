import { expect, it } from "vitest"
import { analysisLanguageModel, analysisModel } from "@/lib/analysis"
import { runVerdictEvals, saveVerdictResult } from "./verdicts"

// The verdict eval on evals/verdicts.json with the real model: 20 calls, one per case. Passes with at least
// 85% of the cases passing all their checks, every must-pass case passing and G1 at 0 violations.
// Saves the run in evals/results/verdicts-{date}.json and prints it next to the previous run.
// v17 has a rubric scored by a person (Mario): its reasoning is printed, not judged.

it("verdict on the eval set", { timeout: 20 * 60_000 }, async () => {
  const run = await runVerdictEvals({ model: analysisLanguageModel(), modelId: analysisModel() })
  const { report } = saveVerdictResult(run)

  const lines = [`\nEval verdetto, ${run.summary.model} @ ${run.summary.commit}. ${report}\n`]
  for (const r of run.results) {
    lines.push(`  ${r.passed ? "✓" : "✗"} ${r.id}${r.mustPass ? " (must-pass)" : ""}: ${r.verdicts.map((v) => v.verdict).join(", ")}`)
    for (const failure of r.failures) lines.push(`      ${failure}`)
  }
  const v17 = run.results.find((r) => r.id === "v17")
  if (v17) lines.push(`\n  v17, da valutare a mano (ragionamento in inglese?): ${v17.verdicts.map((v) => v.reasoning).join(" | ")}`)
  console.log(lines.join("\n"))

  expect(run.summary.g1Violations).toBe(0)
  expect(run.summary.mustPassFailed).toEqual([])
  expect(run.summary.passRate).toBeGreaterThanOrEqual(run.summary.threshold)
})
