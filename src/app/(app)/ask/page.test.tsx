import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

// The /ask page rendered on the server with fixed data: which state it opens in.
const data = vi.hoisted(() => ({ window: { total: 0, recent: 0 }, used: 0 }))
vi.mock("@/lib/data", () => ({
  getCurrentWorkspace: async () => ({ id: "ws", name: "Acme" }),
  getQuestionWindow: async () => data.window,
  getUsage: async () => ({ plan: "free", questionsThisMonth: data.used, questionsLimit: 10 }),
}))

const { default: AskPage } = await import("./page")

async function render() {
  return renderToStaticMarkup(await AskPage())
}

beforeEach(() => {
  data.window = { total: 0, recent: 0 }
  data.used = 0
})

describe("/ask with nothing to ask", () => {
  it("no feedback: text A and Aggiungi feedback, no field", async () => {
    const html = await render()
    expect(html).toContain("Qui farai domande ai tuoi feedback e leggerai le risposte con le parole dei clienti.")
    expect(html).toContain(
      "Per rispondere servono feedback. Aggiungili dal modulo pubblico, da un CSV o incollandoli a mano."
    )
    expect(html).toMatch(/<a[^>]*href="\/research"[^>]*>Aggiungi feedback<\/a>/)
    expect(html).not.toContain("<textarea")
  })

  it("only feedback older than 90 days: text B with their number, no field", async () => {
    data.window = { total: 3, recent: 0 }
    const html = await render()
    expect(html).toContain("Negli ultimi 90 giorni non è arrivato nessun feedback.")
    expect(html).toContain(
      "Chiedi legge solo i feedback degli ultimi 90 giorni, e i tuoi 3 sono più vecchi. Aggiungine di recenti per fare una domanda."
    )
    expect(html).toMatch(/<a[^>]*href="\/research"[^>]*>Aggiungi feedback<\/a>/)
    expect(html).not.toContain("<textarea")
  })

  it("with feedback of the last 90 days the field is there", async () => {
    data.window = { total: 3, recent: 2 }
    const html = await render()
    expect(html).toContain("<textarea")
    expect(html).not.toContain("Aggiungi feedback")
  })
})
