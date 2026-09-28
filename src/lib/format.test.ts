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
})
