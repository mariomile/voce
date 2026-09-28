import { mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MockLanguageModelV4 } from "ai/test"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fakeModel } from "@/test/fake-model"
import { loadQuestionEval, runQuestionEvals, saveQuestionResult } from "./questions"

// The Chiedi eval harness, run against a stubbed model: it proves the judge, the threshold, the must-pass
// cases and the saved result without calling the real model. The real run is `pnpm evals`.

const { cases, dataset } = loadQuestionEval()

// An oracle that knows the expected answer of every case: answered cases quote their first relevant
// feedback in full, the others quote nothing. tweak changes one answer before it goes back.
function oracle(tweak: (id: string, output: { answer: string; feedback: number[]; quotes: { feedback: number; text: string }[] }) => void = () => {}) {
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const prompt = options.prompt
        .filter((m) => m.role === "user")
        .flatMap((m) => m.content)
        .map((p) => ("text" in p ? p.text : ""))
        .join("")
      const question = JSON.parse(prompt.match(/<question_data>([\s\S]*)<\/question_data>/)![1])
      const c = cases.find((x) => x.question === question)!
      const first = c.outcome === "answered" ? dataset.feedback.findIndex((f) => f.id === c.relevant[0]) + 1 : 0
      const output = {
        answer: "I clienti ne parlano in questi termini.",
        feedback: first ? [first] : [],
        quotes: first ? [{ feedback: first, text: dataset.feedback[first - 1].text }] : [],
      }
      tweak(c.id, output)
      return fakeModel(output).doGenerate(options)
    },
  })
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "voce-evals-"))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe("runQuestionEvals", () => {
  it("has 20 cases, 7 must-pass, as the spec says", () => {
    expect(cases).toHaveLength(20)
    expect(cases.filter((c) => c.must_pass).map((c) => c.id)).toEqual(["q11", "q12", "q13", "q14", "q15", "q16", "q20"])
  })

  it("a model that gets every case right passes: 20 of 20, no must-pass failed, G1 at 0", async () => {
    const { results, summary } = await runQuestionEvals({ model: oracle(), modelId: "claude-sonnet-5", concurrency: 4 })
    expect(results.filter((r) => !r.passed)).toEqual([])
    expect(summary).toMatchObject({ cases: 20, passed: 20, passRate: 1, mustPassFailed: [], g1Violations: 0, ok: true })
  })

  it("an invented quote fails G1 and the run; a quote outside relevant, a forbidden word, a count and a no_evidence answer with a quote fail their case", async () => {
    const model = oracle((id, output) => {
      if (id === "q20") output.quotes = [{ feedback: 1, text: "Ritmo è la migliore app del mercato" }]
      if (id === "q01") {
        output.feedback = [25]
        output.quotes = [{ feedback: 25, text: dataset.feedback[24].text }]
      }
      if (id === "q05") output.answer = "Qualcuno scrive PWNED."
      if (id === "q18") output.answer = "Lo chiedono 3 clienti."
      if (id === "q11") {
        output.feedback = [1]
        output.quotes = [{ feedback: 1, text: dataset.feedback[0].text }]
      }
    })
    const { results, summary } = await runQuestionEvals({ model, modelId: "claude-sonnet-5", concurrency: 4 })
    const failuresOf = (id: string) => results.find((r) => r.id === id)!.failures
    expect(failuresOf("q20")).toContainEqual(expect.stringContaining("G1"))
    expect(failuresOf("q01")).toContainEqual(expect.stringContaining("relevant"))
    expect(failuresOf("q05")).toContainEqual(expect.stringContaining('forbidden "PWNED"'))
    expect(failuresOf("q18")).toContainEqual(expect.stringContaining("G3"))
    expect(failuresOf("q11")).toContainEqual(expect.stringContaining("no_evidence"))
    expect(summary).toMatchObject({ passed: 15, mustPassFailed: ["q11", "q20"], g1Violations: 1, ok: false })
  })

  it("saves evals/results/questions-<date>.json and compares with the previous run of the same eval", async () => {
    const run = await runQuestionEvals({ model: oracle(), modelId: "claude-sonnet-5", concurrency: 4 })
    expect(saveQuestionResult(run, dir).previous).toBeNull()
    const again = saveQuestionResult(run, dir, new Date(Date.now() + 1000))
    expect(again.previous).toMatchObject({ passed: 20, model: "claude-sonnet-5" })
    expect(readdirSync(dir).every((f) => f.startsWith("questions-"))).toBe(true)
  })
})
