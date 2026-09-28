import { expect, it } from "vitest"
import { analysisLanguageModel, analysisModel } from "@/lib/analysis"
import { runQuestionEvals, saveQuestionResult } from "./questions"

// The Chiedi eval on evals/questions.json with the real model: 20 calls, one per case. Passes with at least
// 85% of the cases passing all their checks, every must-pass case passing and G1 at 0 violations.
// Saves the run in evals/results/questions-{date}.json and prints it next to the previous run.
// q17 has a rubric scored by a person (Mario): its answer is printed, not judged.

it("Chiedi on the eval set", { timeout: 20 * 60_000 }, async () => {
  const run = await runQuestionEvals({ model: analysisLanguageModel(), modelId: analysisModel() })
  const { report } = saveQuestionResult(run)

  const lines = [`\nEval Chiedi, ${run.summary.model} @ ${run.summary.commit}. ${report}\n`]
  for (const r of run.results) {
    lines.push(`  ${r.passed ? "✓" : "✗"} ${r.id}${r.mustPass ? " (must-pass)" : ""}: ${r.quotes} citazioni, ${r.sentences} frasi`)
    for (const failure of r.failures) lines.push(`      ${failure}`)
  }
  const q17 = run.results.find((r) => r.id === "q17")
  if (q17) lines.push(`\n  q17, da valutare a mano: ${q17.answer}`)
  console.log(lines.join("\n"))

  expect(run.summary.g1Violations).toBe(0)
  expect(run.summary.mustPassFailed).toEqual([])
  expect(run.summary.passRate).toBeGreaterThanOrEqual(run.summary.threshold)
})
