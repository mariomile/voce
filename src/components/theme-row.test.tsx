import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { ThemeSummary } from "@/lib/data"

// The status and priority controls call a server action: here the row only renders.
vi.mock("@/app/actions", () => ({ updateTheme: vi.fn() }))
const { ThemeRow } = await import("./theme-row")

const theme: ThemeSummary = {
  id: "22222222-2222-4222-8222-222222222222",
  workspaceId: "33333333-3333-4333-8333-333333333333",
  researchId: "11111111-1111-4111-8111-111111111111",
  analysisId: "44444444-4444-4444-8444-444444444444",
  kind: "problem",
  title: "Prezzo per utente troppo alto",
  summary: "Sintesi.",
  sentiment: "negative",
  priority: null,
  status: "to_review",
  feedbackCount: 14,
  change: null,
  trend: Array(13).fill(0),
  quotes: [],
}

describe("ThemeRow", () => {
  it("shows +{k} dal {data} or Nuovo", () => {
    const more = renderToStaticMarkup(
      <ThemeRow theme={{ ...theme, change: { kind: "more", count: 5, since: "2026-10-08T10:00:00Z" } }} />
    )
    expect(more).toContain("+5 dal 8 ottobre")
    const created = renderToStaticMarkup(<ThemeRow theme={{ ...theme, change: { kind: "new" } }} />)
    expect(created).toContain(">Nuovo<")
    const same = renderToStaticMarkup(<ThemeRow theme={theme} />)
    expect(same).not.toContain("Nuovo")
    expect(same).not.toContain("+")
  })

  it("links to the theme inside its Research, with the title as h3", () => {
    const html = renderToStaticMarkup(<ThemeRow theme={theme} />)
    expect(html).toMatch(
      /<h3[^>]*><a[^>]*href="\/research\/11111111-1111-4111-8111-111111111111\/themes\/22222222-2222-4222-8222-222222222222"/
    )
  })
})
