import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The screen calls server actions: here it only renders its first act, the pile.
vi.mock("@/app/(app)/research/[id]/actions", () => ({ synthesize: vi.fn() }))
vi.mock("@/app/research/[id]/sala/actions", () => ({ roomThemes: vi.fn() }))
const { RoomScreen } = await import("./room-screen")

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

  it("with hypotheses, says the verdict is in the Research; without, says nothing of it", () => {
    const note = "Il verdetto delle ipotesi lo trovi nella Research."
    expect(renderToStaticMarkup(<RoomScreen {...props} hasHypotheses />)).toContain(note)
    expect(renderToStaticMarkup(<RoomScreen {...props} />)).not.toContain(note)
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
