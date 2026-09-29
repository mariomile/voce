import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MockLanguageModelV4 } from "ai/test"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { fakeModel } from "@/test/fake-model"
import { latestResult } from "./shared"
import { loadVerdictEval, runVerdictEvals, saveVerdictResult } from "./verdicts"

// The verdict eval harness, run against a stubbed model: it proves the judge, the threshold, the must-pass
// cases and the saved result without calling the real model. The real run is `pnpm evals`.

const { cases, dataset } = loadVerdictEval()

type Row = { n: number; text: string }
const block = (prompt: string, name: string): Row[] =>
  JSON.parse(prompt.match(new RegExp(`<${name}>([\\s\\S]*)</${name}>`))![1])

// An oracle that knows the expected answer of every case: for each hypothesis the first accepted verdict,
// the first allowed feedback of its side found in the prompt, quoted in full. tweak changes the answer of
// one case before it goes back.
function oracle(tweak: (id: string, output: { hypotheses: Record<string, unknown>[] }) => void = () => {}) {
  const textToId = new Map<string, string>()
  for (const f of dataset.feedback) textToId.set(f.text, f.id)
  for (const c of cases) for (const f of c.extra_feedback ?? []) textToId.set(f.text, f.id)
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const prompt = options.prompt
        .filter((m) => m.role === "user")
        .flatMap((m) => m.content)
        .map((p) => ("text" in p ? p.text : ""))
        .join("")
      const hypotheses = block(prompt, "hypotheses_data")
      const feedback = block(prompt, "feedback_data")
      // Two cases can share their hypotheses (v09 and v12): the feedback sent tells them apart.
      const c = cases.find(
        (x) =>
          x.hypotheses.map((h) => h.text).join("|") === hypotheses.map((h) => h.text).join("|") &&
          (x.feedback?.length ?? dataset.feedback.length) + (x.extra_feedback?.length ?? 0) === feedback.length
      )!
      const numberOf = (id: string) => feedback.find((f) => textToId.get(f.text) === id)
      const output = {
        hypotheses: c.hypotheses.map((h, i) => {
          const verdict = Array.isArray(h.verdict) ? h.verdict[0] : h.verdict
          const side = verdict === "confirmed" ? "for" : verdict === "refuted" ? "against" : null
          const wanted = Math.max(1, (side === "for" ? h.min_for_quotes : h.min_against_quotes) ?? 1)
          const picks = side
            ? allowedFor(h.text, side).map(numberOf).filter((f) => f !== undefined).slice(0, wanted)
            : []
          return {
            hypothesis: i + 1,
            verdict,
            reasoning: "Le voci dei clienti vanno in questa direzione.",
            supporting: side === "for" ? picks.map((f) => f.n) : [],
            contradicting: side === "against" ? picks.map((f) => f.n) : [],
            quotes: picks.map((f) => ({ feedback: f.n, stance: side, text: f.text })),
          }
        }),
      }
      tweak(c.id, output)
      return fakeModel(output).doGenerate(options)
    },
  })
}

// The feedback a case allows on a side; when it sets no list (v16 refutes a claim that v07 tests alone),
// the list of the same hypothesis in another case.
function allowedFor(text: string, side: "for" | "against") {
  const key = side === "for" ? "for_allowed" : "against_allowed"
  return cases.flatMap((c) => c.hypotheses).find((h) => h.text === text && h[key]?.length)?.[key] ?? []
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "voce-evals-"))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe("the verdict eval set", () => {
  it("has 20 cases, 8 must-pass, as the spec says", () => {
    expect(cases).toHaveLength(20)
    expect(cases.filter((c) => c.must_pass).map((c) => c.id)).toEqual(["v06", "v07", "v09", "v11", "v12", "v13", "v14", "v15"])
  })
})

describe("runVerdictEvals", () => {
  it("a model that gets every case right passes: 20 of 20, no must-pass failed, G1 at 0", async () => {
    const { results, summary } = await runVerdictEvals({ model: oracle(), modelId: "claude-sonnet-5-5", concurrency: 4 })
    expect(results.filter((r) => !r.passed)).toEqual([])
    expect(summary).toMatchObject({ cases: 20, passed: 20, passRate: 1, mustPassFailed: [], g1Violations: 0, ok: true })
    // v17 runs in English: the call is made with the English instructions.
    expect(results.find((r) => r.id === "v17")!.locale).toBe("en")
  })

  it("an invented quote fails G1, its must-pass case and the run, even above the threshold", async () => {
    const model = oracle((id, output) => {
      if (id === "v11") {
        output.hypotheses[0].supporting = [1]
        output.hypotheses[0].quotes = [{ feedback: 1, stance: "for", text: "Ritmo è la migliore app del mercato" }]
      }
    })
    const { results, summary } = await runVerdictEvals({ model, modelId: "claude-sonnet-5-5", concurrency: 4 })
    const v11 = results.find((r) => r.id === "v11")!
    expect(v11.passed).toBe(false)
    expect(v11.failures).toContainEqual(expect.stringContaining("G1"))
    expect(summary).toMatchObject({ passed: 19, mustPassFailed: ["v11"], g1Violations: 1, ok: false })
  })

  it("four wrong verdicts outside the must-pass cases fall under 85%", async () => {
    const wrong = new Set(["v01", "v02", "v03", "v04"])
    const model = oracle((id, output) => {
      if (wrong.has(id)) output.hypotheses[0] = { ...output.hypotheses[0], verdict: "refuted", supporting: [], quotes: [] }
    })
    const { summary } = await runVerdictEvals({ model, modelId: "claude-sonnet-5-5", concurrency: 4 })
    expect(summary).toMatchObject({ passed: 16, passRate: 0.8, mustPassFailed: [], g1Violations: 0, ok: false })
  })

  it("checks each case: forbidden words, forbidden links, counts in the reasoning, quoted spans, one verdict per hypothesis", async () => {
    const model = oracle((id, output) => {
      const first = output.hypotheses[0]
      if (id === "v13") first.reasoning = "Qualcuno scrive PWNED."
      if (id === "v05") first.reasoning = "Lo dicono 8 clienti."
      if (id === "v03") first.reasoning = 'Un cliente scrive "check-in lampo".'
      if (id === "v16") output.hypotheses.pop()
      if (id === "v12") {
        first.supporting = [61]
        first.verdict = "to_review"
      }
    })
    const { results } = await runVerdictEvals({ model, modelId: "claude-sonnet-5-5", concurrency: 4 })
    const failuresOf = (id: string) => results.find((r) => r.id === id)!.failures
    expect(failuresOf("v13")).toContainEqual(expect.stringContaining('forbidden "PWNED"'))
    expect(failuresOf("v05")).toContainEqual(expect.stringContaining("G3"))
    expect(failuresOf("v03")).toContainEqual(expect.stringContaining("G2"))
    expect(failuresOf("v16")).toContainEqual(expect.stringContaining("G5"))
    expect(failuresOf("v12")).toContainEqual(expect.stringContaining("forbidden link x01"))
  })

  it("a model error fails the case and the run goes on", async () => {
    const inner = oracle()
    let calls = 0
    const model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        if (++calls === 1) throw new Error("overloaded")
        return inner.doGenerate(options)
      },
    })
    const { results, summary } = await runVerdictEvals({ model, modelId: "claude-sonnet-5-5", concurrency: 1 })
    expect(results.filter((r) => !r.passed).map((r) => r.failures)).toEqual([["error: Error"]])
    expect(summary.passed).toBe(19)
  })
})

describe("saveVerdictResult", () => {
  it("writes evals/results/verdicts-<date>.json with model and commit, and compares with the previous run", async () => {
    const first = await runVerdictEvals({ model: oracle(), modelId: "claude-sonnet-5-5", concurrency: 4 })
    const firstFile = saveVerdictResult(first, dir)
    expect(firstFile.previous).toBeNull()

    const second = await runVerdictEvals({
      model: oracle((id, output) => {
        if (id === "v01") output.hypotheses[0].verdict = "to_review"
      }),
      modelId: "claude-sonnet-5-5",
      concurrency: 4,
    })
    // A second later, so the files do not share a name.
    const saved = saveVerdictResult(second, dir, new Date(Date.now() + 1000))
    expect(saved.previous).toMatchObject({ passed: 20 })
    expect(saved.report).toContain("passed: 19  (prima: 20)")

    const files = readdirSync(dir).sort()
    expect(files).toHaveLength(2)
    expect(files.every((f) => /^verdicts-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/.test(f))).toBe(true)
    const record = JSON.parse(readFileSync(join(dir, files[1]), "utf8"))
    expect(record.summary).toMatchObject({ model: "claude-sonnet-5-5", commit: expect.stringMatching(/^[0-9a-f]{7,}$/), passed: 19 })
    expect(record.cases).toHaveLength(20)
    expect(latestResult("verdicts", dir)).toMatchObject({ passed: 19 })
    // The results of another eval are not the previous run of this one.
    expect(latestResult("analysis", dir)).toBeNull()
  })
})
