import { describe, expect, it } from "vitest"
import type { Hypothesis, Verdict } from "./data"
import { formState, roomThemes, roomVerdicts } from "./room"

describe("formState", () => {
  it("is open when the link is on and the Free limit is not reached", () => {
    expect(formState({ formEnabled: true, feedbackCount: 99, feedbackLimit: 100 })).toBe("open")
    expect(formState({ formEnabled: true, feedbackCount: 5000, feedbackLimit: null })).toBe("open")
  })

  it("is off when the PM turned the link off, whatever the limit", () => {
    expect(formState({ formEnabled: false, feedbackCount: 100, feedbackLimit: 100 })).toBe("off")
  })

  it("is full at the Free limit of 100 feedback", () => {
    expect(formState({ formEnabled: true, feedbackCount: 100, feedbackLimit: 100 })).toBe("full")
  })
})

const theme = (title: string, feedbackCount: number) => ({
  id: title,
  workspaceId: "w",
  analysisId: "a",
  kind: "problem" as const,
  title,
  summary: "Una sintesi scritta dal modello",
  sentiment: "negative" as const,
  priority: null,
  status: "to_review" as const,
  feedbackCount,
  trend: [1, 2],
  quotes: [{ feedbackId: "f", text: "Testo di un cliente", highlight: null, channel: "Modulo pubblico", receivedAt: "2026-10-01" }],
})

describe("roomThemes", () => {
  it("keeps the 5 largest themes, largest first", () => {
    const themes = [theme("b", 3), theme("a", 9), theme("c", 2), theme("d", 7), theme("e", 4), theme("f", 5)]
    expect(roomThemes(themes).map((t) => t.title)).toEqual(["a", "d", "f", "e", "b"])
  })

  it("sends only kind, title and count: no summary, no quotes, no feedback text", () => {
    expect(roomThemes([theme("a", 2)])).toEqual([{ id: "a", kind: "problem", title: "a", feedbackCount: 2 }])
  })
})

const verdict = (word: Verdict["verdict"], supporting: number, contradicting: number): Verdict => ({
  verdict: word,
  reasoning: "Una motivazione scritta dal modello",
  feedbackRead: 230,
  arrivedAfter: 230,
  supporting,
  contradicting,
  quotesFor: [{ feedbackId: "f1", text: "Testo di un cliente a favore", highlight: null, channel: "Modulo pubblico", receivedAt: "2026-10-01" }],
  quotesAgainst: [{ feedbackId: "f2", text: "Testo di un cliente contro", highlight: null, channel: "Modulo pubblico", receivedAt: "2026-10-01" }],
  arrivedAfterVerdict: 3,
})

const hypothesis = (id: string, v: Verdict | null): Hypothesis => ({ id, text: `Ipotesi ${id}`, writtenAt: "2026-10-01T16:00:00Z", verdict: v })

describe("roomVerdicts", () => {
  it("sends only the hypothesis text, the verdict word and the counts: no reasoning, no quotes, no feedback text", () => {
    const sent = roomVerdicts([hypothesis("a", verdict("confirmed", 48, 12))])
    expect(sent).toEqual([{ id: "a", text: "Ipotesi a", verdict: "confirmed", supporting: 48, contradicting: 12, feedbackRead: 230 }])
    expect(JSON.stringify(sent)).not.toMatch(/motivazione|Testo di un cliente/)
  })

  it("keeps the order the PM wrote them in, and leaves out a hypothesis with no verdict yet", () => {
    const sent = roomVerdicts([
      hypothesis("a", verdict("refuted", 2, 30)),
      hypothesis("b", null),
      hypothesis("c", verdict("to_review", 4, 4)),
    ])
    expect(sent.map((h) => [h.id, h.verdict])).toEqual([
      ["a", "refuted"],
      ["c", "to_review"],
    ])
  })

  it("reads a verdict with no feedback linked as to_review, like the Sintesi", () => {
    expect(roomVerdicts([hypothesis("a", verdict("confirmed", 0, 0))])[0].verdict).toBe("to_review")
  })
})
