import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ResearchSummary } from "@/lib/data"

// /research rendered on the server with fixed data: the first run, or the list.
const data = vi.hoisted(() => ({ research: [] as ResearchSummary[] }))
vi.mock("@/lib/data", () => ({
  getCurrentWorkspace: async () => ({ id: "ws", name: "Acme" }),
  listResearch: async () => data.research,
}))

// The question field navigates after a creation: no Next router in a unit test.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))

const { default: ResearchPage } = await import("./page")

async function render() {
  return renderToStaticMarkup(await ResearchPage())
}

beforeEach(() => {
  data.research = []
})

describe("/research", () => {
  it("with no Research shows the first-run title, the field and Crea la Research, without Nuova Research", async () => {
    const html = await render()
    expect(html).toContain("Qui tieni le tue domande sui clienti, con le loro risposte.")
    expect(html).toContain(
      "Parti da una domanda a cui vuoi rispondere prima di una decisione. Poi raccogli i feedback: modulo con QR code, note di intervista, CSV."
    )
    expect(html).toMatch(/<label[^>]*>La tua domanda<\/label>/)
    expect(html).toContain("Crea la Research")
    expect(html).not.toContain("Nuova Research")
    expect(html).not.toContain("Le tue Research")
  })

  it("with Research lists them under Le tue Research, with Nuova Research and no field", async () => {
    data.research = [
      { id: "11111111-1111-4111-8111-111111111111", question: "Prima domanda?", formEnabled: true, feedbackCount: 3 },
      { id: "22222222-2222-4222-8222-222222222222", question: "Seconda domanda?", formEnabled: false, feedbackCount: 0 },
    ] as ResearchSummary[]
    const html = await render()
    expect(html).toContain("Le tue Research")
    expect(html).toContain("Una Research parte da una domanda sui clienti e raccoglie i feedback che servono a rispondere.")
    expect(html).toMatch(/<a[^>]*href="\/research\/new"[^>]*>Nuova Research<\/a>/)
    expect(html.indexOf("Prima domanda?")).toBeLessThan(html.indexOf("Seconda domanda?"))
    expect(html).toContain("Modulo spento")
    expect(html).not.toContain("La tua domanda")
    expect(html).not.toContain("Qui tieni le tue domande sui clienti")
  })
})
