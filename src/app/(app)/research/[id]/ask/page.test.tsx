import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The Chiedi tab of a Research rendered on the server with fixed data: which state it opens in.
const RESEARCH = "11111111-1111-4111-8111-111111111111"
const data = vi.hoisted(() => ({
  total: 0,
  perimeter: 0,
  used: 0,
  topics: { hypotheses: [], themes: [] } as {
    hypotheses: { text: string; verdict: "confirmed" | null }[]
    themes: { title: string; kind: "problem" }[]
  },
}))
vi.mock("@/lib/data", () => ({
  getResearch: async (id: string) => (id === RESEARCH ? { id, workspaceId: "ws" } : null),
  getResearchStats: async () => ({ feedbackCount: data.total }),
  getAnalysisPerimeter: async () => data.perimeter,
  getUsage: async () => ({ plan: "free", questionsThisMonth: data.used, questionsLimit: 10 }),
  getAskTopics: async () => data.topics,
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
  data.topics = { hypotheses: [], themes: [] }
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

  it("suggests questions from its hypotheses and themes, as buttons that fill the field", async () => {
    data.total = 212
    data.perimeter = 212
    data.topics = {
      hypotheses: [{ text: "La banca salta spesso", verdict: "confirmed" }],
      themes: [{ title: "Export per il commercialista", kind: "problem" }],
    }
    const html = await render()
    expect(html).toContain("Prova a chiedere")
    expect(html).toMatch(/<button type="button"[^>]*><span[^>]*>Chi smentisce «La banca salta spesso», e perché\?<\/span>/)
    expect(html).toContain("Cosa chiedono i clienti per risolvere «Export per il commercialista»?")
    expect(html).toContain("Invio per chiedere, Maiusc+Invio per andare a capo.")
  })

  it("without hypotheses or themes, three starters", async () => {
    data.total = 3
    data.perimeter = 3
    const html = await render()
    expect(html).toContain("Cosa chiedono più spesso i clienti?")
  })

  it("the month's questions used up: no suggestions", async () => {
    data.total = 3
    data.perimeter = 3
    data.used = 10
    const html = await render()
    expect(html).not.toContain("Prova a chiedere")
  })

  it("a Research the user cannot read is the not-found page", async () => {
    await expect(render("22222222-2222-4222-8222-222222222222")).rejects.toThrow("NEXT_NOT_FOUND")
  })
})
