import { describe, expect, it } from "vitest"
import { translator } from "@/test/next-intl"
import { PLAN_LIMITS } from "@/lib/plans"
import {
  askButtonLabel,
  askErrors,
  answerSummary,
  failedMessage,
  limitNotice,
  nextMonthName,
  quotaNote,
  slowMessage,
} from "./ask-copy"

// The exact texts of DESIGN.md (initiative chiedi-ai-feedback, "Error copy").

const t = translator("ask")

describe("error copy", () => {
  it("E1, E2, E5, E7, E8, E9 are the texts of the design", () => {
    const errors = askErrors(t)
    expect(errors.empty).toBe("Scrivi una domanda prima di inviarla. Per esempio: cosa dicono i clienti dei prezzi?")
    expect(errors.tooLong).toBe("La domanda supera i 300 caratteri: accorciala a una sola richiesta.")
    expect(errors.busy).toBe(
      "C'è già una domanda in corso, forse da un'altra scheda. Aspetta qualche secondo e riprova."
    )
    expect(errors.network).toBe(
      "Non riesco a raggiungere Voce: controlla la connessione e riprova. Se la domanda era già partita, conta tra quelle del mese."
    )
    expect(errors.session).toEqual({
      text: "La sessione è scaduta. Accedi di nuovo per fare la domanda.",
      link: "Accedi",
      href: "/login",
    })
    expect(errors.noFeedback).toEqual({
      text: "Negli ultimi 90 giorni non ci sono più feedback su cui rispondere.",
      link: "Aggiungi feedback",
      href: "/collect",
    })
  })

  it("E6 says how many questions are left", () => {
    expect(failedMessage(t, { used: 3, quota: 10 }, "settembre")).toBe(
      "La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti restano 7 domande di settembre. Riprova tra poco."
    )
    expect(failedMessage(t, { used: 9, quota: 10 }, "settembre")).toBe(
      "La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti resta 1 domanda di settembre. Riprova tra poco."
    )
    expect(failedMessage(t, { used: 10, quota: 10 }, "settembre")).toBe(
      "La risposta non è arrivata. La domanda conta lo stesso: hai usato tutte le domande di settembre."
    )
  })

  it("E3 on Free offers Pro, E4 on Pro does not", () => {
    expect(limitNotice(t, "free", 10, "settembre", "ottobre")).toEqual({
      title: "Hai usato le 10 domande di settembre",
      text: "Con Pro diventano 100 al mese. Altrimenti tornano disponibili il 1 ottobre.",
      upgrade: true,
    })
    expect(limitNotice(t, "pro", 100, "settembre", "ottobre")).toEqual({
      title: "Hai usato le 100 domande di settembre",
      text: "Tornano disponibili il 1 ottobre.",
      upgrade: false,
    })
  })

  it("the next month follows the Italian calendar", () => {
    expect(nextMonthName(new Date("2026-09-30T21:59:00Z"), "it")).toBe("ottobre")
    // 23:30 on 30 September in UTC is already 1 October in Rome.
    expect(nextMonthName(new Date("2026-09-30T22:30:00Z"), "it")).toBe("novembre")
    expect(nextMonthName(new Date("2026-12-15T10:00:00Z"), "it")).toBe("gennaio")
  })
})

describe("quota note", () => {
  it("before the first question of the month, then what is left, with numbers from the server", () => {
    expect(quotaNote(t, { used: 0, quota: 10 }, "settembre")).toBe("Userai 1 delle 10 domande di settembre.")
    expect(quotaNote(t, { used: 3, quota: 10 }, "settembre")).toBe("Ti restano 7 domande di settembre.")
    expect(quotaNote(t, { used: 9, quota: 10 }, "settembre")).toBe("Ti resta 1 domanda di settembre.")
    expect(quotaNote(t, { used: 0, quota: 100 }, "ottobre")).toBe("Userai 1 delle 100 domande di ottobre.")
  })

  it("E3 names the Pro quota from PLAN_LIMITS", () => {
    expect(PLAN_LIMITS.free.questionsPerMonth).toBe(10)
    expect(PLAN_LIMITS.pro.questionsPerMonth).toBe(100)
    expect(limitNotice(t, "free", 10, "settembre", "ottobre").text).toContain(
      `Con Pro diventano ${PLAN_LIMITS.pro.questionsPerMonth} al mese.`
    )
  })
})

describe("button and waiting", () => {
  it("the button names how many feedback it reads", () => {
    expect(askButtonLabel(t, 212, 212)).toBe("Chiedi ai 212 feedback")
    expect(askButtonLabel(t, 1, 1)).toBe("Chiedi a 1 feedback")
    expect(askButtonLabel(t, 500, 740)).toBe("Chiedi ai 500 feedback più recenti")
  })

  it("after 15 seconds the longer message", () => {
    expect(slowMessage(t)).toBe("Ci vuole più del solito. La risposta arriva: resta su questa pagina.")
  })

  it("the status region sums up the answer", () => {
    expect(
      answerSummary(t, { outcome: "answered", feedbackCount: 23, answer: "Chiedono l'export.", quoteCount: 5, feedbackConsidered: 212 })
    ).toBe("Risposta pronta. 23 feedback ne parlano. Chiedono l'export. Sotto ci sono 5 citazioni.")
    expect(
      answerSummary(t, { outcome: "answered", feedbackCount: 1, answer: "Uno solo.", quoteCount: 1, feedbackConsidered: 212 })
    ).toBe("Risposta pronta. 1 feedback ne parla. Uno solo. Sotto c'è 1 citazione.")
    expect(answerSummary(t, { outcome: "no_evidence", feedbackConsidered: 212 })).toBe(
      "Non trovo feedback che ne parlano. Letti 212 feedback degli ultimi 90 giorni."
    )
  })
})
