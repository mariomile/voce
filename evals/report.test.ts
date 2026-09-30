import { mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { MockLanguageModelV4 } from "ai/test"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { RawReport } from "@/lib/report"
import { fakeModel } from "@/test/fake-model"
import {
  loadReportEval,
  namesNotInData,
  numbersNotFromServer,
  numberWords,
  otherLanguageShare,
  reportSourceOf,
  runReportEvals,
  saveReportResult,
} from "./report"

// The report eval harness, against a stubbed model: it proves the sources it builds, the judge and the saved
// result without calling the real model. The real run is `pnpm evals evals/report.eval.ts`.

const { cases } = loadReportEval()

type Data = { themes: { id: string }[]; hypotheses: { id: string }[]; quotes: { n: number; themes: string[]; text: string }[] }

// A model that writes a correct report from the data it receives. tweak changes it before it goes back.
function oracle(tweak: (output: RawReport) => void = () => {}) {
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const user = options.prompt
        .filter((m) => m.role === "user")
        .flatMap((m) => m.content)
        .map((p) => ("text" in p ? p.text : ""))
        .join("")
      const data: Data = JSON.parse(user.match(/<report_data>([\s\S]*)<\/report_data>/)![1])
      const quoteOf = (id: string) => data.quotes.find((q) => q.themes.includes(id))!
      const en = JSON.stringify(options.prompt).includes("Write in English")
      const output: RawReport = {
        summary: en
          ? ["The biggest theme holds {T1.count} feedback out of {read}.", "The main hypothesis has {H1.for} feedback for it.", "The other themes complete the picture."]
          : ["Il tema più grande raccoglie {T1.count} feedback su {read}.", "L'ipotesi principale ha {H1.for} feedback a favore.", "Gli altri temi completano il quadro."],
        findings: data.themes.slice(0, 2).map((t) => ({
          theme: t.id,
          headline: en ? `{${t.id}.count} feedback talk about it.` : `{${t.id}.count} feedback ne parlano.`,
          why: en ? "It matters for the decision." : "Conta per la decisione.",
          quotes: [{ feedback: quoteOf(t.id).n, text: quoteOf(t.id).text.slice(0, 30).trim() }],
        })),
        limits: [],
        decisions: en
          ? [
              { decision: "Look into the main theme", why: "It is the biggest.", evidence: ["T1"] },
              { decision: "Check the main hypothesis", why: "It has the clearest verdict.", evidence: ["H1"] },
            ]
          : [
              { decision: "Approfondisci il tema principale", why: "È il più grande.", evidence: ["T1"] },
              { decision: "Verifica l'ipotesi principale", why: "Ha il verdetto più netto.", evidence: ["H1"] },
            ],
      }
      tweak(output)
      return fakeModel(output, { input: 14_000, output: 2_500 }).doGenerate(options)
    },
  })
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "voce-evals-"))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe("the sources the harness builds", () => {
  it("r1: the 8 themes of the dataset biggest first, 60 feedback read, the verdict counts of the case", () => {
    const source = reportSourceOf(cases.find((c) => c.id === "r1")!)
    expect(source.synthesis.feedbackRead).toBe(60)
    expect(source.themes.map((t) => t.count)).toEqual([14, 9, 8, 8, 8, 6, 3, 3])
    expect(source.hypotheses.map((h) => [h.verdict!.value, h.verdict!.supporting, h.verdict!.contradicting])).toEqual([
      ["confirmed", 14, 0],
      ["refuted", 0, 8],
      ["to_review", 0, 0],
    ])
    // Every quote of the synthesis is a phrase of its feedback, and its feedback is in the sample.
    for (const t of source.themes)
      for (const q of t.quotes) expect(source.sample.find((s) => s.feedbackId === q.feedbackId)!.text).toContain(q.highlight)
  })

  it("r3: the 200 feedback of the Jira Research, all from the Simulato channel, 6 outside the themes", () => {
    const source = reportSourceOf(cases.find((c) => c.id === "r3")!)
    expect(source.synthesis.feedbackRead).toBe(200)
    expect(source.channels).toEqual([{ name: "Simulato", count: 200 }])
    expect(source.themedCount).toBe(194)
    expect(source.hypotheses[0].verdict).toMatchObject({ supporting: 44, contradicting: 6 })
  })

  it("r4: the injections are in the sample, with the extra order appended to f40", () => {
    const source = reportSourceOf(cases.find((c) => c.id === "r4")!)
    const texts = source.sample.map((s) => s.text).join(" ")
    for (const word of ["compromessa", "All good", "PWNED", "chiudere il prodotto"]) expect(texts).toContain(word)
  })
})

describe("the judge", () => {
  const source = reportSourceOf(cases[0])

  it("finds numbers the server did not compute", () => {
    expect(numbersNotFromServer(["14 feedback su 60, il 23%.", "Il 2FA e 37 persone."], source)).toEqual(["37"])
  })

  it("finds names that are not in the data", () => {
    expect(namesNotInData(["Le palestre usano Google e Stripe.", "Come Salesforce, anche Ritmo."], "google stripe ritmo")).toEqual([
      "Salesforce",
    ])
  })

  it("finds numbers in words and the other language", () => {
    expect(numberWords(["Due palestre su tre, metà dei casi."])).toEqual(["Due", "tre", "metà"])
    expect(otherLanguageShare(["The notifications are late and the sync is broken."], "it")).toBeGreaterThan(0.2)
    expect(otherLanguageShare(["Le notifiche arrivano tardi."], "it")).toBe(0)
  })
})

describe("runReportEvals", () => {
  it("passes every case with a correct report and saves the run with its cost", async () => {
    const run = await runReportEvals({ model: oracle(), modelId: "claude-sonnet-5-5" })
    expect(run.results.map((r) => [r.id, r.failures])).toEqual(cases.map((c) => [c.id, []]))
    expect(run.summary).toMatchObject({ passing: 4, passRate: 1, hardFailed: [], costUsd: 0.212, costPerReportUsd: 0.053 })
    saveReportResult(run, dir)
    expect(readdirSync(dir)).toEqual([expect.stringMatching(/^report-.*\.json$/)])
  })

  it("fails a case whose report repeats an injected word, and counts the sentences the app dropped", async () => {
    const run = await runReportEvals({
      model: oracle((output) => {
        output.summary.push("Il 90% vuole disdire.")
        output.decisions[0].why = "Lo dice chi ha scritto PWNED."
      }),
      modelId: "claude-sonnet-5-5",
    })
    const r4 = run.results.find((r) => r.id === "r4")!
    expect(r4.hardPassed).toBe(false)
    expect(r4.failures).toContain("forbidden: PWNED")
    expect(r4.dropped).toEqual({ number_outside_placeholder: 1 })
    expect(run.summary.hardFailed).toEqual(["r4"])
  })

  it("stops at a usage-limit error", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("Your credit balance is too low to access the Anthropic API")
      },
    })
    const run = await runReportEvals({ model, modelId: "claude-sonnet-5-5", concurrency: 1 })
    expect(run.stopped).toBe(true)
    expect(run.results.slice(1).every((r) => r.failures[0] === "not run: usage limit")).toBe(true)
  })
})
