import { describe, expect, it } from "vitest"
import { ASK_ERRORS, failedMessage, limitNotice, nextMonthName } from "./ask-copy"

// The exact texts of DESIGN.md (initiative chiedi-ai-feedback, "Error copy").

describe("error copy", () => {
  it("E1, E2, E5, E7, E8, E9 are the texts of the design", () => {
    expect(ASK_ERRORS.empty).toBe("Scrivi una domanda prima di inviarla. Per esempio: cosa dicono i clienti dei prezzi?")
    expect(ASK_ERRORS.tooLong).toBe("La domanda supera i 300 caratteri: accorciala a una sola richiesta.")
    expect(ASK_ERRORS.busy).toBe(
      "C'è già una domanda in corso, forse da un'altra scheda. Aspetta qualche secondo e riprova."
    )
    expect(ASK_ERRORS.network).toBe(
      "Non riesco a raggiungere Voce: controlla la connessione e riprova. Se la domanda era già partita, conta tra quelle del mese."
    )
    expect(ASK_ERRORS.session).toEqual({
      text: "La sessione è scaduta. Accedi di nuovo per fare la domanda.",
      link: "Accedi",
      href: "/login",
    })
    expect(ASK_ERRORS.noFeedback).toEqual({
      text: "Negli ultimi 90 giorni non ci sono più feedback su cui rispondere.",
      link: "Aggiungi feedback",
      href: "/collect",
    })
  })

  it("E6 says how many questions are left", () => {
    expect(failedMessage({ used: 3, quota: 10 }, "settembre")).toBe(
      "La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti restano 7 domande di settembre. Riprova tra poco."
    )
    expect(failedMessage({ used: 9, quota: 10 }, "settembre")).toBe(
      "La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ti resta 1 domanda di settembre. Riprova tra poco."
    )
    expect(failedMessage({ used: 10, quota: 10 }, "settembre")).toBe(
      "La risposta non è arrivata. La domanda conta lo stesso: hai usato tutte le domande di settembre."
    )
  })

  it("E3 on Free offers Pro, E4 on Pro does not", () => {
    expect(limitNotice("free", 10, "settembre", "ottobre")).toEqual({
      title: "Hai usato le 10 domande di settembre",
      text: "Con Pro diventano 100 al mese. Altrimenti tornano disponibili il 1 ottobre.",
      upgrade: true,
    })
    expect(limitNotice("pro", 100, "settembre", "ottobre")).toEqual({
      title: "Hai usato le 100 domande di settembre",
      text: "Tornano disponibili il 1 ottobre.",
      upgrade: false,
    })
  })

  it("the next month follows the Italian calendar", () => {
    expect(nextMonthName(new Date("2026-09-30T21:59:00Z"))).toBe("ottobre")
    // 23:30 on 30 September in UTC is already 1 October in Rome.
    expect(nextMonthName(new Date("2026-09-30T22:30:00Z"))).toBe("novembre")
    expect(nextMonthName(new Date("2026-12-15T10:00:00Z"))).toBe("gennaio")
  })
})
