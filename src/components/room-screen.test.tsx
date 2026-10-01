import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The screen calls server actions: here it renders its first act, the pile, and runs the analysis against mocks.
vi.mock("@/app/(app)/research/[id]/actions", () => ({ synthesize: vi.fn() }))
vi.mock("@/app/research/[id]/sala/actions", () => ({ roomThemes: vi.fn(), roomVerdicts: vi.fn() }))
const { RoomScreen, VerdictView, analyzeRoom } = await import("./room-screen")
const { synthesize } = await import("@/app/(app)/research/[id]/actions")
const { roomThemes, roomVerdicts } = await import("@/app/research/[id]/sala/actions")

const props = {
  researchId: "11111111-1111-4111-8111-111111111111",
  workspaceName: "Acme",
  question: "Cosa vuoi dire al team?",
  shortUrl: "voce.test/f/acme",
  qrCode: <svg role="img" aria-label="QR" />,
  initialStatus: { responses: 3, form: "open" as const },
  hasHypotheses: false,
}

const analyzeButton = (html: string) => html.match(/<button[^>]*>Analizza le risposte<\/button>/)?.[0] ?? ""

describe("RoomScreen", () => {
  it("the room button is off with the quota note, aria-disabled so the focus stays on it", () => {
    const note = "Hai usato le 3 analisi di ottobre del piano Free."
    const html = renderToStaticMarkup(<RoomScreen {...props} limitNote={note} />)
    expect(analyzeButton(html)).toContain(`aria-disabled="true"`)
    expect(analyzeButton(html)).not.toMatch(/\sdisabled=""/)
    expect(html).toContain(note)
  })

  it("the room button is on with responses and analyses left", () => {
    const html = renderToStaticMarkup(<RoomScreen {...props} />)
    expect(analyzeButton(html)).not.toContain("aria-disabled")
  })

  it("with hypotheses, says the verdict comes with the themes; without, says nothing of it", () => {
    const note = "Con i temi arriva anche il verdetto delle ipotesi."
    expect(renderToStaticMarkup(<RoomScreen {...props} hasHypotheses />)).toContain(note)
    expect(renderToStaticMarkup(<RoomScreen {...props} />)).not.toContain(note)
  })
})

// A server action that never answers (the network drops, the function runs past its time) rejects: the
// room stays on the pile with a note instead of the error page.
describe("analyzeRoom", () => {
  const done = { ok: true as const, themes: "done" as const, themeCount: 1, verdict: "skipped" as const }

  it("a rejected analysis is a network failure, not a thrown error", async () => {
    vi.mocked(synthesize).mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(analyzeRoom(props.researchId)).resolves.toEqual({ failure: "network" })
  })

  it("the themes or the verdict that fail to load after the analysis are a network failure too", async () => {
    vi.mocked(synthesize).mockResolvedValueOnce(done as never)
    vi.mocked(roomThemes).mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(analyzeRoom(props.researchId)).resolves.toEqual({ failure: "network" })

    vi.mocked(synthesize).mockResolvedValueOnce({ ...done, verdict: "done" } as never)
    vi.mocked(roomThemes).mockResolvedValueOnce([])
    vi.mocked(roomVerdicts).mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(analyzeRoom(props.researchId)).resolves.toEqual({ failure: "network" })
  })

  it("the analysis that answers still gives its themes", async () => {
    const theme = { id: "t1", kind: "opportunity" as const, title: "PDF", count: 2 }
    vi.mocked(synthesize).mockResolvedValueOnce(done as never)
    vi.mocked(roomThemes).mockResolvedValueOnce([theme] as never)
    await expect(analyzeRoom(props.researchId)).resolves.toEqual({ themes: [theme], themesMissing: null, verdict: null })
  })

  it("tells answers that gave no theme apart from themes that failed, when the verdict arrived", async () => {
    vi.mocked(synthesize).mockResolvedValueOnce({ ...done, themes: "no_themes", verdict: "done" } as never)
    vi.mocked(roomVerdicts).mockResolvedValueOnce([])
    await expect(analyzeRoom(props.researchId)).resolves.toMatchObject({ themes: [], themesMissing: "no_themes" })

    vi.mocked(synthesize).mockResolvedValueOnce({ ...done, themes: "failed", verdict: "done" } as never)
    vi.mocked(roomVerdicts).mockResolvedValueOnce([])
    await expect(analyzeRoom(props.researchId)).resolves.toMatchObject({ themes: [], themesMissing: "failed" })
  })
})

describe("VerdictView", () => {
  const hypothesis = {
    id: "h1",
    text: "Quello che ti blocca di più è la parte tecnica",
    verdict: "confirmed" as const,
    supporting: 48,
    contradicting: 12,
    feedbackRead: 230,
  }

  it("shows the hypothesis, the word of its verdict and the counts", () => {
    const html = renderToStaticMarkup(<VerdictView verdict={{ state: "done", hypotheses: [hypothesis] }} />)
    expect(html).toContain("Quello che ti blocca di più è la parte tecnica")
    expect(html).toContain(`<span aria-hidden="true">✓</span> Confermata`)
    expect(html).toContain("48 feedback a favore · 12 contro · su 230 letti")
  })

  it("every verdict word, and no counts when no feedback talks about the hypothesis", () => {
    const html = renderToStaticMarkup(
      <VerdictView
        verdict={{
          state: "done",
          hypotheses: [
            { ...hypothesis, id: "a", verdict: "refuted", supporting: 3, contradicting: 1500 },
            { ...hypothesis, id: "b", verdict: "to_review", supporting: 0, contradicting: 0 },
          ],
        }}
      />
    )
    expect(html).toContain("Smentita")
    expect(html).toContain("3 feedback a favore · 1.500 contro · su 230 letti")
    expect(html).toContain("Da rivedere")
    expect(html).toContain("Nessuno dei 230 feedback letti ne parla.")
  })

  it("says why there is no verdict: failed, only one analysis left, or none saved", () => {
    expect(renderToStaticMarkup(<VerdictView verdict={{ state: "failed" }} />)).toContain("Il verdetto non è arrivato")
    expect(renderToStaticMarkup(<VerdictView verdict={{ state: "limit" }} />)).toContain("Era rimasta una sola analisi del mese")
    expect(renderToStaticMarkup(<VerdictView verdict={{ state: "done", hypotheses: [] }} />)).toContain(
      "Nessuna ipotesi ha ricevuto un verdetto."
    )
  })
})

// What the room reads from a distance is at least 7:1 on its background (DESIGN.md, accessibility floor).
describe("room contrast", () => {
  const css = readFileSync("src/app/globals.css", "utf8")
  const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`))![1]
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a: string, b: string) => {
    const [x, y] = [luminance(token(a)), luminance(token(b))].sort((m, n) => n - m)
    return (x + 0.05) / (y + 0.05)
  }

  it("every text colour of the screen reaches 7:1 on the background it sits on", () => {
    // Text on the pile (highlight), on the themes (paper), in the ink panels (R1, form off, form full).
    const pairs = [
      ["ink", "highlight"],
      ["on-highlight", "highlight"],
      ["ink", "paper"],
      ["paper", "ink"],
      ["highlight", "ink"],
    ]
    for (const [text, background] of pairs) expect(ratio(text, background), `${text} on ${background}`).toBeGreaterThanOrEqual(7)
  })

  it("the screen uses no text colour under 7:1: muted, subtle, problem or the theme kinds", () => {
    const source = readFileSync("src/components/room-screen.tsx", "utf8")
    expect(source).not.toMatch(/text-(ink-muted|ink-subtle|problem|opportunity|praise)\b/)
    // The kind of a theme keeps its coloured dot (the badge's colour); its word is ink.
    expect(source).toMatch(/<Badge[^>]*>\s*<span className="text-ink">/)
  })
})
