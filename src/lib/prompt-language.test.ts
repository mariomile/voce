import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { fakeModel } from "@/test/fake-model"
import { analysisInstructions, runAnalysis } from "./analysis"
import { questionInstructions, questionOutputSchemaFor, runQuestion } from "./questions"

// The model answers in the language of the interface at request time. Italian is byte for byte the
// prompt that was evaluated before English existed (hashes of the texts at 4ecc5db).
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
    expect(sha(questionInstructions("it"))).toBe("524db758a9d1c75fdc1b4a1f0c68148c490d10a4993f5c110cfe379b7e7fd627")
    expect(sha(JSON.stringify(z.toJSONSchema(questionOutputSchemaFor("it"))))).toBe(
      "96a0855e6c188606be32eba2d335bc5ed0e600d426d27ee4d6d56733b770c85e"
    )
  })

  it("in English asks for the answer in English", () => {
    expect(questionInstructions("en")).toContain("- answer: in English, also when the question or the feedback are in another language.")
    expect(questionInstructions("en")).not.toContain("Italian")
    expect(JSON.stringify(z.toJSONSchema(questionOutputSchemaFor("en")))).toContain("At most 3 sentences in English")
  })

  it("is sent in the requested language", async () => {
    const model = fakeModel({ answer: "Bank sync breaks.", feedback: [1], quotes: [{ feedback: 1, text: "La banca si scollega." }] })
    await runQuestion({ model, modelId: "x", question: "Bank?", feedback, locale: "en" })
    const system = model.doGenerateCalls[0].prompt.filter((m) => m.role === "system")
    expect(system.map((m) => m.content)).toEqual([questionInstructions("en")])
  })
})
