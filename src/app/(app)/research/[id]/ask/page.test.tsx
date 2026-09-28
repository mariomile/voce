import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The Chiedi tab of a Research rendered on the server with fixed data: which state it opens in.
const RESEARCH = "11111111-1111-4111-8111-111111111111"
const data = vi.hoisted(() => ({ total: 0, perimeter: 0, used: 0 }))
vi.mock("@/lib/data", () => ({
  getResearch: async (id: string) => (id === RESEARCH ? { id, workspaceId: "ws" } : null),
  getResearchStats: async () => ({ feedbackCount: data.total }),
  getAnalysisPerimeter: async () => data.perimeter,
  getUsage: async () => ({ plan: "free", questionsThisMonth: data.used, questionsLimit: 10 }),
}))
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

const { default: AskPage } = await import("./page")

async function render(id = RESEARCH) {
  return renderToStaticMarkup(await AskPage({ params: Promise.resolve({ id }) } as never))
}

beforeEach(() => {
  data.total = 0
  data.perimeter = 0
  data.used = 0
})

describe("the Chiedi tab of a Research", () => {
  it("no feedback: the action goes to /research/{id}/collect, no field", async () => {
    const html = await render()
    expect(html).toContain("Qui farai domande ai tuoi feedback e leggerai le risposte con le parole dei clienti.")
    expect(html).toContain(
      "Per rispondere servono feedback. Aggiungili dal modulo pubblico, da un CSV o incollandoli a mano."
    )
    expect(html).toMatch(new RegExp(`<a[^>]*href="/research/${RESEARCH}/collect"[^>]*>Aggiungi feedback</a>`))
    expect(html).not.toContain("<textarea")
  })

  it("with feedback the field is there, and the button says how many it reads", async () => {
    data.total = 740
    data.perimeter = 500
    const html = await render()
    expect(html).toContain("<textarea")
    expect(html).toContain("Chiedi ai 500 feedback più recenti")
    expect(html).not.toContain("Aggiungi feedback")
  })

  it("a Research the user cannot read is the not-found page", async () => {
    await expect(render("22222222-2222-4222-8222-222222222222")).rejects.toThrow("NEXT_NOT_FOUND")
  })
})
