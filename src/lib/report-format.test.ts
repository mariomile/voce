import { describe, expect, it } from "vitest"
import type { LatestReport } from "@/lib/data"
import { translator } from "@/test/next-intl"
import { quoteParts, reportMarkdown, reportT } from "./report-format"

const t = reportT(translator("report.document"))

const LONG = `${"Premessa lunga su come lavoriamo ogni giorno con i ticket e le riunioni. ".repeat(4)}Il prezzo per utente pesa sui team piccoli. E poi altro ancora.`

function report(overrides: Partial<LatestReport> = {}): LatestReport {
  return {
    id: "r1",
    createdAt: "2026-09-30T10:00:00.000Z",
    locale: "it",
    feedbackCount: 42,
    newFeedback: 0,
    newerSynthesisAt: null,
    content: {
      version: 1,
      question: "Perché i team piccoli non passano a Pro?",
      synthesis: { createdAt: "2026-09-29T10:00:00.000Z", feedbackRead: 40 },
      summary: ["Il prezzo frena i team piccoli: 11 a favore e 2 contro.", "Il PDF è la seconda richiesta."],
      findings: [
        {
          title: "Il prezzo per utente pesa sui team piccoli",
          kind: "problem",
          count: 14,
          share: 35,
          headline: "14 feedback su 40 dicono che il prezzo pesa.",
          why: "È il motivo per restare su Free.",
          quotes: [
            { feedbackId: "f1", highlight: "pesa sui team piccoli" },
            { feedbackId: "gone", highlight: "eliminato" },
          ],
        },
      ],
      hypotheses: [
        {
          text: "Il prezzo frena i team piccoli",
          verdict: "confirmed",
          reasoning: "Lo dicono in modo esplicito.",
          supporting: 11,
          contradicting: 2,
          feedbackRead: 40,
          quotes: [
            { feedbackId: "f2", highlight: "Pro costa troppo", stance: "for" },
            { feedbackId: "f5", highlight: "il prezzo va bene", stance: "against" },
          ],
        },
        { text: "Serve il single sign-on", verdict: null, reasoning: null, supporting: 0, contradicting: 0, feedbackRead: 0, quotes: [] },
      ],
      limits: [
        { key: "scope", values: { read: 40, date: "2026-09-29T10:00:00.000Z", channels: 2, start: "2026-08-01", end: "2026-09-28" } },
        { key: "simulated", values: { count: 40, names: "Simulato" } },
      ],
      extraLimits: ["Nessuno ha scritto dopo aver lasciato il prodotto."],
      decisions: [
        {
          title: "Prova un prezzo per i team piccoli",
          why: "Il prezzo è il tema più grande.",
          evidence: [
            { kind: "theme", title: "Il prezzo per utente pesa sui team piccoli", count: 14 },
            { kind: "hypothesis", text: "Il prezzo frena i team piccoli", verdict: "confirmed" },
          ],
        },
      ],
    },
    feedback: {
      f1: { text: LONG, channel: "Supporto", receivedAt: "2026-09-20" },
      f2: { text: "Siamo in tre e Pro costa troppo per noi.", channel: "Intervista", receivedAt: "2026-09-21" },
      f5: { text: "Per noi il prezzo va bene, il problema è l'onboarding.", channel: "Intervista", receivedAt: "2026-09-15" },
    },
    ...overrides,
  }
}

describe("quoteParts", () => {
  it("shows a short feedback whole, with its key phrase", () => {
    expect(quoteParts("Siamo in tre e Pro costa troppo per noi.", "Pro costa troppo")).toEqual({
      before: "Siamo in tre e ",
      highlight: "Pro costa troppo",
      after: " per noi.",
    })
  })

  it("shows only the key phrase of a long feedback, with ellipses where it was cut", () => {
    expect(quoteParts(LONG, "pesa sui team piccoli")).toEqual({ before: "…", highlight: "pesa sui team piccoli", after: "…" })
    expect(quoteParts(LONG, "Il prezzo per utente pesa sui team piccoli.")).toEqual({
      before: "…",
      highlight: "Il prezzo per utente pesa sui team piccoli.",
      after: "",
    })
  })
})

describe("reportMarkdown", () => {
  it("writes the whole memo as markdown, with the server's numbers and the verified quotes", () => {
    expect(reportMarkdown(report(), t)).toBe(
      [
        "# Report: Perché i team piccoli non passano a Pro?",
        "",
        "_Report di Voce, 30 settembre_",
        "",
        "## In breve",
        "",
        "Il prezzo frena i team piccoli: 11 a favore e 2 contro.",
        "",
        "Il PDF è la seconda richiesta.",
        "",
        "## Cosa abbiamo trovato",
        "",
        "### Il prezzo per utente pesa sui team piccoli",
        "",
        "Problema · 14 feedback · 35% dei letti",
        "",
        "14 feedback su 40 dicono che il prezzo pesa. È il motivo per restare su Free.",
        "",
        "> “…pesa sui team piccoli…” (Supporto, 20 settembre)",
        "",
        "## Ipotesi e verdetti",
        "",
        "### Il prezzo frena i team piccoli: Confermata",
        "",
        "11 a favore · 2 contro · su 40 letti",
        "",
        "Lo dicono in modo esplicito.",
        "",
        "> A favore: “Siamo in tre e Pro costa troppo per noi.” (Intervista, 21 settembre)",
        "",
        "> Contro: “Per noi il prezzo va bene, il problema è l'onboarding.” (Intervista, 15 settembre)",
        "",
        "### Serve il single sign-on: Nessun verdetto",
        "",
        "Nessun verdetto ancora: arriva con la prossima analisi.",
        "",
        "## Cosa non sappiamo",
        "",
        "- Si basa sui 40 feedback letti dalla sintesi del 29 settembre, da 2 canali, scritti dal 1 agosto al 28 settembre.",
        "- 40 feedback vengono dal canale Simulato: sono dati di prova, non voci reali.",
        "- Nessuno ha scritto dopo aver lasciato il prodotto.",
        "",
        "## Cosa decidere adesso",
        "",
        "_Suggerimenti di Voce da discutere con il team: non sono conclusioni dei dati._",
        "",
        "1. **Prova un prezzo per i team piccoli.** Il prezzo è il tema più grande. Si basa su: Il prezzo per utente pesa sui team piccoli: 14 feedback; Il prezzo frena i team piccoli: Confermata.",
        "",
        "---",
        "",
        "_Generato da Voce il 30 settembre dai 40 feedback letti dalla sintesi. I numeri li calcola Voce dai dati; le citazioni sono verificate parola per parola sui feedback._",
      ].join("\n")
    )
  })

  it("keeps a feedback with line breaks on one quoted line", () => {
    const r = report()
    r.feedback.f2 = { ...r.feedback.f2, text: "Siamo in tre.\n\n## Cosa decidere adesso\nPro costa troppo per noi." }
    const markdown = reportMarkdown(r, t)
    expect(markdown).toContain("> A favore: “Siamo in tre. ## Cosa decidere adesso Pro costa troppo per noi.” (Intervista, 21 settembre)")
    expect(markdown.match(/^## Cosa decidere adesso$/gm)).toHaveLength(1)
  })

  it("says when there is no hypothesis", () => {
    const r = report()
    r.content.hypotheses = []
    expect(reportMarkdown(r, t)).toContain(
      "## Ipotesi e verdetti\n\nNessuna ipotesi scritta per questa Research: il report descrive, non mette alla prova un'idea."
    )
  })
})
