import { MockLanguageModelV4 } from "ai/test"

// A model that answers with fixed output and usage: tests never call a real model.
export function fakeModel(
  output: unknown,
  usage = { input: 1200, output: 300 },
  finishReason: "stop" | "length" = "stop"
) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: typeof output === "string" ? output : JSON.stringify(output) }],
      finishReason: { unified: finishReason, raw: undefined },
      usage: {
        inputTokens: { total: usage.input, noCache: usage.input, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: usage.output, text: usage.output, reasoning: undefined },
      },
      warnings: [],
    }),
  })
}

// One synthesis makes two calls: the themes and, with hypotheses, the verdict, told apart by the verdict's
// data block. Each answers with its own output, or fails with its own error.
export function fakeSynthesisModel(
  themes: unknown,
  verdict: unknown,
  usage = { input: 1200, output: 300 }
) {
  const answer = (output: unknown) => (output instanceof Error ? null : fakeModel(output, usage))
  const themesModel = answer(themes)
  const verdictModel = answer(verdict)
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const isVerdict = JSON.stringify(options.prompt).includes("<hypotheses_data>")
      const model = isVerdict ? verdictModel : themesModel
      if (!model) throw isVerdict ? verdict : themes
      return model.doGenerate(options)
    },
  })
}

type ThemeWithFeedback = { feedback: number[] } & Record<string, unknown>

// The output of the themes call, written as themes that list their feedback: numbers each theme from 1 and
// turns the lists into one row per feedback number, as the model writes them. sent: the feedback sent, each
// with a row, empty when in no theme.
export function themesOutput<T extends ThemeWithFeedback>(themes: T[], sent = 0) {
  const rows = new Map<number, number[]>(Array.from({ length: sent }, (_, i) => [i + 1, []]))
  themes.forEach((t, i) => {
    for (const n of t.feedback) rows.set(n, [...(rows.get(n) ?? []), i + 1])
  })
  return {
    themes: themes.map((t, i) => ({ n: i + 1, ...without(t, ["feedback"]) })),
    assignments: [...rows].sort(([a], [b]) => a - b).map(([feedback, themes]) => ({ feedback, themes })),
  }
}

type HypothesisWithSides = { hypothesis: number; supporting: number[]; contradicting: number[] } & Record<string, unknown>

// The output of the verdict call, written as hypotheses that list their feedback on each side: turns the lists
// into one row of evidence per feedback number, as the model writes them. sent: the feedback sent, each with a
// row, empty when it says nothing about any hypothesis.
export function verdictOutput<H extends HypothesisWithSides>(hypotheses: H[], sent = 0) {
  const rows = new Map<number, { for: number[]; against: number[] }>(
    Array.from({ length: sent }, (_, i) => [i + 1, { for: [], against: [] }])
  )
  const row = (n: number) => rows.get(n) ?? rows.set(n, { for: [], against: [] }).get(n)!
  for (const h of hypotheses) {
    for (const n of h.supporting) row(n).for.push(h.hypothesis)
    for (const n of h.contradicting) row(n).against.push(h.hypothesis)
  }
  return {
    evidence: [...rows].map(([feedback, sides]) => ({ feedback, ...sides })),
    hypotheses: hypotheses.map((h) => without(h, ["supporting", "contradicting"])),
  }
}

// A copy of object without the given keys.
export function without<T extends object, K extends keyof T>(object: T, keys: K[]): Omit<T, K> {
  const copy = { ...object }
  for (const key of keys) delete copy[key]
  return copy
}
