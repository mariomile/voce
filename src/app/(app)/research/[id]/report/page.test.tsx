import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LatestReport } from "@/lib/data"
import type { ReportSource } from "@/lib/report"

// The Report tab of a Research rendered on the server with fixed data: which state it opens in, and what the
// report shows.
const RESEARCH = "11111111-1111-4111-8111-111111111111"
const data = vi.hoisted(() => ({
  report: null as unknown,
  source: null as unknown,
  used: 0,
}))
vi.mock("@/lib/data", () => ({
  getResearch: async (id: string) => (id === RESEARCH ? { id, workspaceId: "ws", question: "Domanda?" } : null),
  getLatestReport: async () => data.report,
  getReportSource: async () => data.source,
  getUsage: async () => ({ plan: "free", analysesThisMonth: data.used, analysesLimit: 3 }),
}))
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

const { default: ReportPage } = await import("./page")

async function render(id = RESEARCH) {
  return renderToStaticMarkup(await ReportPage({ params: Promise.resolve({ id }) } as never))
}

const SOURCE = {
  synthesis: { analysisId: "a", createdAt: "2026-09-29T10:00:00.000Z", feedbackRead: 200 },
  themes: [{ id: "t" }, { id: "u" }],
  hypotheses: [{ id: "h" }],
} as unknown as ReportSource

function report(overrides: Partial<LatestReport> = {}): LatestReport {
  return {
    id: "r1",
    createdAt: "2026-09-30T10:00:00.000Z",
    locale: "it",
    feedbackCount: 200,
    newFeedback: 0,
    newerSynthesisAt: null,
    content: {
      version: 1,
      question: "Jira va ancora bene per un team di prodotto?",
      synthesis: { createdAt: "2026-09-29T10:00:00.000Z", feedbackRead: 200 },
      summary: ["Jira è lento per chi ha scritto: 58 a favore e 4 contro.", "Il costo pesa meno del previsto."],
      findings: [
        {
          title: "Jira è lento e pesante da usare",
          kind: "problem",
          count: 58,
          share: 29,
          headline: "58 feedback su 200 dicono che Jira è lento.",
          why: "Rallenta ogni giorno il team.",
          quotes: [
            { feedbackId: "f1", highlight: "ogni pagina ci mette secondi" },
            { feedbackId: "gone", highlight: "eliminato dopo" },
          ],
        },
      ],
      hypotheses: [
        {
          text: "Jira è lento",
          verdict: "confirmed",
          reasoning: "Chi ha scritto lo ripete spesso.",
          supporting: 58,
          contradicting: 4,
          feedbackRead: 200,
          quotes: [{ feedbackId: "f1", highlight: "ogni pagina ci mette secondi", stance: "for" }],
        },
      ],
      limits: [{ key: "simulated", values: { count: 200, names: "Simulato" } }],
      extraLimits: ["Nessuno scrive da un team che ha già lasciato Jira."],
      decisions: [
        {
          title: "Misura i tempi di caricamento",
          why: "La lentezza è il tema più grande.",
          evidence: [{ kind: "theme", title: "Jira è lento e pesante da usare", count: 58 }],
        },
      ],
    },
    feedback: { f1: { text: "Con Jira ogni pagina ci mette secondi ad aprirsi.", channel: "Simulato", receivedAt: "2026-09-20" } },
    ...overrides,
  }
}

beforeEach(() => {
  data.report = null
  data.source = null
  data.used = 0
})

describe("the Report tab of a Research", () => {
  it("without a synthesis: explains the report comes from it and leads to the Sintesi, nothing to generate", async () => {
    const html = await render()
    expect(html).toContain("Il report parte dalla sintesi.")
    expect(html).toMatch(new RegExp(`<a[^>]*href="/research/${RESEARCH}"[^>]*>Vai alla Sintesi</a>`))
    expect(html).not.toContain("Genera il report")
  })

  it("with a synthesis whose themes are all gone: says so, and leads to the Sintesi", async () => {
    data.source = { ...SOURCE, themes: [] }
    const html = await render()
    expect(html).toContain("La sintesi non ha temi da mettere nel report.")
    expect(html).toContain("Vai alla Sintesi")
    expect(html).not.toContain("Genera il report")
  })

  it("with a synthesis and no report: what the report is, from which synthesis, and its cost", async () => {
    data.source = SOURCE
    const html = await render()
    expect(html).toContain("Un memo per difendere la decisione.")
    expect(html).toContain("Dalla sintesi del 29 settembre: 200 feedback letti, 2 temi, 1 ipotesi.")
    expect(html).toContain("Genera il report")
    expect(html).toMatch(/Userai 1 delle 3 analisi di \w+\./)
    expect(html).not.toContain("data-report")
  })

  it("at the monthly limit the button is off and says why", async () => {
    data.source = SOURCE
    data.used = 3
    const html = await render()
    expect(html).toMatch(/aria-disabled="true"[^>]*>Genera il report/)
    expect(html).toMatch(/Hai usato le 3 analisi di \w+\. Con Pro diventano 100 al mese\./)
  })

  it("shows the latest report: the five sections, the server's numbers, verified quotes of feedback that still exist", async () => {
    data.report = report()
    const html = await render()
    for (const title of ["In breve", "Cosa abbiamo trovato", "Ipotesi e verdetti", "Cosa non sappiamo", "Cosa decidere adesso"])
      expect(html).toContain(title)
    expect(html).toContain("data-report")
    expect(html).toContain("Jira è lento per chi ha scritto: 58 a favore e 4 contro.")
    expect(html).toContain("29% dei letti")
    expect(html).toContain("58 a favore · 4 contro · su 200 letti")
    expect(html).toContain("Con Jira <mark>ogni pagina ci mette secondi</mark> ad aprirsi.")
    expect(html).not.toContain("eliminato dopo")
    expect(html).toContain("200 feedback vengono dal canale Simulato: sono dati di prova, non voci reali.")
    expect(html).toContain("Nessuno scrive da un team che ha già lasciato Jira.")
    expect(html).toContain("Suggerimenti di Voce da discutere con il team: non sono conclusioni dei dati.")
    expect(html).toContain("Jira è lento e pesante da usare: 58 feedback")
    expect(html).toContain("Report del 30 settembre, dalla sintesi del 29 settembre.")
    // The actions of a report that is up to date: Rigenera is secondary, next to Copia and Stampa.
    expect(html).toContain("Copia come testo")
    expect(html).toContain("Stampa o salva PDF")
    expect(html).toMatch(/class="[^"]*bg-veil[^"]*"[^>]*>Rigenera/)
    expect(html).not.toContain("La Research è cambiata dopo questo report.")
  })

  it("says when a newer synthesis came after the report, and makes Rigenera the main action", async () => {
    data.report = report({ newerSynthesisAt: "2026-10-02T09:00:00.000Z" })
    const html = await render()
    expect(html).toContain("La Research è cambiata dopo questo report.")
    expect(html).toContain("Una sintesi più recente, del 2 ottobre, non è ancora nel report.")
    expect(html).toMatch(/class="[^"]*bg-ink[^"]*"[^>]*>Rigenera/)
  })

  it("says when feedback arrived after the report, and sends to the Sintesi to analyze them first", async () => {
    data.report = report({ newFeedback: 3 })
    const html = await render()
    expect(html).toContain("3 feedback arrivati dopo il report, non ancora nella sintesi.")
    expect(html).toMatch(new RegExp(`<a[^>]*href="/research/${RESEARCH}"[^>]*>Vai alla Sintesi</a>`))
  })

  it("says when the report is in another language than the interface", async () => {
    data.report = report({ locale: "en" })
    expect(await render()).toContain("Questo report è in inglese. Rigeneralo per averlo in italiano.")
  })

  it("is the not-found page for a Research the user cannot read", async () => {
    await expect(render("22222222-2222-4222-8222-222222222222")).rejects.toThrow("NEXT_NOT_FOUND")
  })
})
