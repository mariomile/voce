import { describe, expect, it } from "vitest"
import { formState, roomThemes } from "./room"

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
