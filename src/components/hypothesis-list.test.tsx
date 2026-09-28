import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Hypothesis } from "@/lib/data"

// The actions write to the database: here the section only renders.
vi.mock("@/app/(app)/research/[id]/actions", () => ({
  addHypothesis: vi.fn(),
  updateHypothesis: vi.fn(),
  deleteHypothesis: vi.fn(),
}))
const { HypothesisList, FailureNote } = await import("./hypothesis-list")
const { translator } = await import("@/test/next-intl")

const RESEARCH = "11111111-1111-4111-8111-111111111111"

function hypothesis(n: number): Hypothesis {
  return { id: `22222222-2222-4222-8222-22222222222${n}`, text: `Ipotesi <b>${n}</b>`, hasVerdict: false }
}

describe("HypothesisList", () => {
  it("empty: one line and Scrivi un'ipotesi, no field yet", () => {
    const html = renderToStaticMarkup(<HypothesisList researchId={RESEARCH} hypotheses={[]} />)
    expect(html).toMatch(/<h2[^>]*>Ipotesi<\/h2>/)
    expect(html).toContain("Hai un&#x27;idea da mettere alla prova? Scrivila come ipotesi: i feedback diranno se la confermano.")
    expect(html).toContain(">Scrivi un&#x27;ipotesi<")
    expect(html).not.toContain("Nuova ipotesi")
  })

  it("each hypothesis is an h3 as text, without a verdict yet, with named Modifica and Elimina; the field follows", () => {
    const html = renderToStaticMarkup(<HypothesisList researchId={RESEARCH} hypotheses={[hypothesis(1), hypothesis(2)]} />)
    expect(html).toMatch(/<h3[^>]*>Ipotesi &lt;b&gt;1&lt;\/b&gt;<\/h3>/)
    expect(html.match(/Nessun verdetto ancora\. Arriva con la prossima analisi\./g)).toHaveLength(2)
    expect(html).toContain('aria-label="Modifica l&#x27;ipotesi: Ipotesi &lt;b&gt;2&lt;/b&gt;"')
    expect(html).toContain('aria-label="Elimina l&#x27;ipotesi: Ipotesi &lt;b&gt;2&lt;/b&gt;"')
    expect(html).toContain(">Nuova ipotesi<")
    expect(html).toContain("Una frase che si può confermare o smentire.")
    expect(html).toContain(">Aggiungi l&#x27;ipotesi<")
    expect(html).not.toContain("Scrivi un&#x27;ipotesi")
  })

  it("5 hypotheses: H3 in place of the field", () => {
    const html = renderToStaticMarkup(
      <HypothesisList researchId={RESEARCH} hypotheses={[1, 2, 3, 4, 5].map(hypothesis)} />
    )
    expect(html).toContain("Questa Research ha già 5 ipotesi, il massimo. Eliminane una per scriverne un&#x27;altra.")
    expect(html).not.toContain("Nuova ipotesi")
  })

  it("busy shows H7", () => {
    const t = translator("research.hypotheses") as Parameters<typeof FailureNote>[0]["t"]
    const html = renderToStaticMarkup(<FailureNote failure="busy" t={t} message="x" />)
    expect(html).toContain("C&#x27;è un&#x27;analisi in corso su questa Research: le ipotesi si cambiano quando è finita.")
  })
})
