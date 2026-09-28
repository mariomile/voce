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
