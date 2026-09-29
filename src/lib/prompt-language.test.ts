import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { fakeModel } from "@/test/fake-model"
import { analysisInstructions, runAnalysis } from "./analysis"
import { questionInstructions, questionOutputSchemaFor, runQuestion } from "./questions"

// The model answers in the language of the interface at request time. Italian is byte for byte the
// prompt that was evaluated before English existed (hashes of the texts at 4ecc5db), except the question
// prompt, which asks for shorter answers since then (hashes updated with that change).
const sha = (text: string) => createHash("sha256").update(text).digest("hex")
const feedback = [{ id: "f1", text: "La banca si scollega.", channel: "Supporto", receivedAt: "2026-09-01" }]

describe("the analysis prompt", () => {
  it("in Italian is unchanged", () => {
    expect(sha(analysisInstructions("it"))).toBe("2861f4d52094eb9b761044cc967a7d8e42799a5eea4a40bd33228d95494e0068")
  })

  it("in English asks for titles and summaries in English, with an English example", () => {
    const text = analysisInstructions("en")
    expect(text).toContain("- title: in English, short and concrete")
    expect(text).toContain("- summary: in English, 1 or 2 sentences")
    expect(text).not.toContain("Italian")
    expect(text).not.toContain("La sincronizzazione con la banca si interrompe")
  })

  it("is sent in the requested language", async () => {
    const model = fakeModel({ themes: [] })
    await runAnalysis({ model, modelId: "x", feedback, existingTitles: [], locale: "en" })
    const system = model.doGenerateCalls[0].prompt.filter((m) => m.role === "system")
    expect(system).toEqual([{ role: "system", content: analysisInstructions("en") }])
  })
})

describe("the question prompt", () => {
  it("in Italian is unchanged, schema included", () => {
    expect(sha(questionInstructions("it"))).toBe("ff2babd6009b5072e1ef7195c07a530b95f25deaa702de02559d668d2cf7207a")
    expect(sha(JSON.stringify(z.toJSONSchema(questionOutputSchemaFor("it"))))).toBe(
      "635fa784bc6cafb2e3b82df7d3a5f45e5ebe748c4dc9e96eabe3961072fe95eb"
    )
  })

  it("in English asks for the answer in English", () => {
    expect(questionInstructions("en")).toContain("- answer: in English, also when the question or the feedback are in another language.")
    expect(questionInstructions("en")).not.toContain("Italian")
    expect(JSON.stringify(z.toJSONSchema(questionOutputSchemaFor("en")))).toContain("At most 2 short sentences in English, about 40 words")
  })

  it("is sent in the requested language", async () => {
    const model = fakeModel({ answer: "Bank sync breaks.", feedback: [1], quotes: [{ feedback: 1, text: "La banca si scollega." }] })
    await runQuestion({ model, modelId: "x", question: "Bank?", feedback, locale: "en" })
    const system = model.doGenerateCalls[0].prompt.filter((m) => m.role === "system")
    expect(system.map((m) => m.content)).toEqual([questionInstructions("en")])
  })
})
