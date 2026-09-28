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
