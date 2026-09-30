import { describe, expect, it } from "vitest"
import { askSession, beginAsking, clearMissed, endAsking } from "./ask-session"

const answered = (question: string) => ({
  ok: true as const,
  outcome: "answered" as const,
  question,
  answer: "Risposta.",
  feedbackCount: 1,
  feedbackConsidered: 10,
  feedbackTotal: 10,
  quotes: [],
  usage: { used: 1, quota: 10 },
})

describe("the questions of a visit", () => {
  it("the question in flight, then its answer on top of the earlier ones, without the quota", () => {
    beginAsking("r1", "Prima?")
    expect(askSession("r1").pending).toMatchObject({ question: "Prima?" })
    endAsking("r1", answered("Prima?"), true)
    beginAsking("r1", "Seconda?")
    endAsking("r1", answered("Seconda?"), true)
    const session = askSession("r1")
    expect(session.pending).toBeNull()
    expect(session.entries.map((e) => e.result.question)).toEqual(["Seconda?", "Prima?"])
    expect(session.entries[0].result).not.toHaveProperty("usage")
    expect(session.entries[0].result).not.toHaveProperty("ok")
    expect(session.entries[0].id).not.toBe(session.entries[1].id)
  })

  it("a failure on screen only clears the question in flight", () => {
    beginAsking("r2", "Fallisce?")
    endAsking("r2", { question: "Fallisce?", failure: "network" }, true)
    expect(askSession("r2")).toEqual({ entries: [], pending: null, missed: null })
  })

  it("a failure while the tab was not on screen waits for the form, with the question and the quota", () => {
    beginAsking("r5", "Fallisce?")
    const missed = { question: "Fallisce?", failure: "failed" as const, usage: { used: 4, quota: 10 } }
    endAsking("r5", missed, false)
    expect(askSession("r5").missed).toEqual(missed)
    clearMissed("r5")
    expect(askSession("r5").missed).toBeNull()
    // A new question forgets an old failure.
    endAsking("r5", missed, false)
    beginAsking("r5", "Di nuovo?")
    expect(askSession("r5").missed).toBeNull()
  })

  it("each Research keeps its own", () => {
    endAsking("r3", answered("Solo qui?"), true)
    expect(askSession("r4").entries).toEqual([])
    expect(askSession("r3").entries).toHaveLength(1)
  })
})
