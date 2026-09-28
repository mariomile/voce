import { describe, expect, it } from "vitest"
import { formatDate, formatMonth, formatNumber } from "./format"

describe("formatting in the language of the interface", () => {
  it("dates: Italian unchanged, English month first", () => {
    expect(formatDate("2026-09-18", "it")).toBe("18 settembre")
    expect(formatDate("2026-09-18", "en")).toBe("September 18")
  })

  it("months on the Italian calendar", () => {
    const lateOnTheLastDay = new Date("2026-09-30T22:30:00Z")
    expect(formatMonth(lateOnTheLastDay, "it")).toBe("ottobre")
    expect(formatMonth(lateOnTheLastDay, "en")).toBe("October")
  })

  it("numbers: Italian always groups thousands, English with commas", () => {
    expect(formatNumber(2000, "it")).toBe("2.000")
    expect(formatNumber(2000, "en")).toBe("2,000")
    expect(formatNumber(58, "en")).toBe("58")
  })

  it("dates a timestamp on the Italian calendar: 23:10 UTC on the 28th is already the 29th in Rome", () => {
    // Analyses, verdicts and "since" dates are timestamps, as Supabase returns them.
    expect(formatDate("2026-09-28T23:10:48.217445+00:00", "it")).toBe("29 settembre")
    expect(formatDate("2026-09-28T21:59:59+00:00", "en")).toBe("September 28")
    expect(formatDate("2026-03-29T22:30:00Z", "it")).toBe("30 marzo")
  })
})
