import { formatMonth, monthOf } from "@/lib/format"
import { PLAN_LIMITS } from "@/lib/plans"
import type { Plan } from "@/lib/types"

// The texts of "Chiedi" that depend on numbers or on the reason a question did not get an answer.
// Exact strings from the design of the initiative (DESIGN.md, "Error copy").

export const ASK_ERRORS = {
  empty: "Scrivi una domanda prima di inviarla. Per esempio: cosa dicono i clienti dei prezzi?",
  tooLong: "La domanda supera i 300 caratteri: accorciala a una sola richiesta.",
  busy: "C'è già una domanda in corso, forse da un'altra scheda. Aspetta qualche secondo e riprova.",
  network:
    "Non riesco a raggiungere Voce: controlla la connessione e riprova. Se la domanda era già partita, conta tra quelle del mese.",
  session: { text: "La sessione è scaduta. Accedi di nuovo per fare la domanda.", link: "Accedi", href: "/login" },
  noFeedback: {
    text: "Negli ultimi 90 giorni non ci sono più feedback su cui rispondere.",
    link: "Aggiungi feedback",
    href: "/collect",
  },
}

export function failedMessage(usage: { used: number; quota: number }, month: string) {
  const left = Math.max(0, usage.quota - usage.used)
  if (left === 0) return `La risposta non è arrivata. La domanda conta lo stesso: hai usato tutte le domande di ${month}.`
  const rest = left === 1 ? `ti resta 1 domanda di ${month}` : `ti restano ${left} domande di ${month}`
  return `La risposta non è arrivata. La domanda conta lo stesso tra quelle del mese: ${rest}. Riprova tra poco.`
}

// Under the button: what the next question costs, with the numbers read by the server.
export function quotaNote(usage: { used: number; quota: number }, month: string) {
  if (usage.used === 0) return `Userai 1 delle ${usage.quota} domande di ${month}.`
  const left = Math.max(0, usage.quota - usage.used)
  return left === 1 ? `Ti resta 1 domanda di ${month}.` : `Ti restano ${left} domande di ${month}.`
}

export function limitNotice(plan: Plan, quota: number, month: string, nextMonth: string) {
  const title = `Hai usato le ${quota} domande di ${month}`
  return plan === "free"
    ? { title, text: `Con Pro diventano ${PLAN_LIMITS.pro.questionsPerMonth} al mese. Altrimenti tornano disponibili il 1 ${nextMonth}.`, upgrade: true }
    : { title, text: `Tornano disponibili il 1 ${nextMonth}.`, upgrade: false }
}

// The month after the current one on the Italian calendar, when the quota comes back.
export function nextMonthName(now: Date) {
  const [year, month] = monthOf(now).split("-").map(Number)
  return formatMonth(new Date(Date.UTC(year, month, 15)))
}

export const SLOW_MESSAGE = "Ci vuole più del solito. La risposta arriva: resta su questa pagina."

// The button says how many feedback the question reads: the 500 most recent at most.
export function askButtonLabel(feedbackConsidered: number, feedbackInWindow: number) {
  if (feedbackInWindow > feedbackConsidered) return `Chiedi ai ${feedbackConsidered} feedback più recenti`
  return feedbackConsidered === 1 ? "Chiedi a 1 feedback" : `Chiedi ai ${feedbackConsidered} feedback`
}

export const countLabel = (count: number) => (count === 1 ? "feedback ne parla" : "feedback ne parlano")

// Read by screen readers from the status region when the answer arrives. The quotes are not read:
// they are under the answer heading.
export function answerSummary(
  result:
    | { outcome: "answered"; feedbackCount: number; answer: string; quoteCount: number; feedbackConsidered: number }
    | { outcome: "no_evidence"; feedbackConsidered: number }
) {
  if (result.outcome === "no_evidence")
    return `Non trovo feedback che ne parlano. Letti ${result.feedbackConsidered} feedback degli ultimi 90 giorni.`
  const quotes = result.quoteCount === 1 ? "Sotto c'è 1 citazione." : `Sotto ci sono ${result.quoteCount} citazioni.`
  return `Risposta pronta. ${result.feedbackCount} ${countLabel(result.feedbackCount)}. ${result.answer} ${quotes}`
}
