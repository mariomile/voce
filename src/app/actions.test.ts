import { describe, expect, it } from "vitest"
import { submitFeedback, updateTheme } from "./actions"
import * as db from "@/lib/mock-data"

const valid = { slug: "fatturino-k3m9", text: "La banca si scollega.", email: "", website: "" }

describe("submitFeedback", () => {
  it("accepts a valid feedback, with or without email", async () => {
    expect(await submitFeedback(valid)).toEqual({ ok: true })
    expect(await submitFeedback({ ...valid, email: "giulia@esempio.it" })).toEqual({ ok: true })
  })

  it("rejects empty, blank and too long texts", async () => {
    for (const text of ["", "   ", "a".repeat(2001)])
      expect(await submitFeedback({ ...valid, text })).toEqual({ ok: false, reason: "invalid" })
    expect(await submitFeedback({ ...valid, text: "a".repeat(2000) })).toEqual({ ok: true })
  })

  it("rejects a malformed email", async () => {
    expect(await submitFeedback({ ...valid, email: "giulia@" })).toEqual({ ok: false, reason: "invalid_email" })
  })

  it("is unavailable for full, disabled and unknown forms", async () => {
    for (const slug of ["ordinalo-7fq2", "spento-a1b2", "nope"])
      expect(await submitFeedback({ ...valid, slug })).toEqual({ ok: false, reason: "unavailable" })
  })

  it("rejects a malformed payload without crashing", async () => {
    // @ts-expect-error not an object on purpose
    expect(await submitFeedback(null)).toEqual({ ok: false, reason: "invalid" })
  })

  it("pretends success when the honeypot is filled", async () => {
    expect(await submitFeedback({ ...valid, text: "", website: "http://spam" })).toEqual({ ok: true })
  })
})

describe("updateTheme", () => {
  const theme = db.themes.find((t) => t.workspaceId === "ws_fatturino")!

  it("accepts a valid change on a theme of the current workspace", async () => {
    expect(await updateTheme({ themeId: theme.id, priority: "high", status: "roadmap" })).toEqual({ ok: true })
    expect(await updateTheme({ themeId: theme.id, priority: null, status: "discarded" })).toEqual({ ok: true })
  })

  it("rejects unknown values and themes outside the workspace", async () => {
    // @ts-expect-error invalid status on purpose
    expect(await updateTheme({ themeId: theme.id, priority: null, status: "shipped" })).toEqual({ ok: false })
    expect(await updateTheme({ themeId: "th_missing", priority: null, status: "done" })).toEqual({ ok: false })
  })
})
