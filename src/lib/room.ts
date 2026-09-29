import type { Hypothesis, Verdict } from "./data"
import type { Theme } from "./types"

// The room screen: what it shows, reduced to counts. Feedback text never reaches it.

// Fixed by the database in submit_public_feedback: the channel of every public form response.
export const PUBLIC_FORM_CHANNEL = "Modulo pubblico"
export const ROOM_THEMES = 5

export type FormState = "open" | "off" | "full"

export type RoomStatus = { responses: number; form: FormState }

export type RoomTheme = Pick<Theme, "id" | "kind" | "title"> & { feedbackCount: number }

// A hypothesis on the room screen: the PM's sentence, the word of its verdict and the counts. Never the
// reasoning or the quotes, which are feedback text.
export type RoomVerdict = Pick<Hypothesis, "id" | "text"> &
  Pick<Verdict, "verdict" | "supporting" | "contradicting" | "feedbackRead">

// Same rule as private.accepts_feedback: the link is on and the Free limit is not reached.
export function formState(input: { formEnabled: boolean; feedbackCount: number; feedbackLimit: number | null }): FormState {
  if (!input.formEnabled) return "off"
  if (input.feedbackLimit !== null && input.feedbackCount >= input.feedbackLimit) return "full"
  return "open"
}

// Only what the screen shows: the rest of a theme (summary, quotes) stays on the server.
export function roomThemes(themes: (RoomTheme & Record<string, unknown>)[]): RoomTheme[] {
  return [...themes]
    .sort((a, b) => b.feedbackCount - a.feedbackCount)
    .slice(0, ROOM_THEMES)
    .map(({ id, kind, title, feedbackCount }) => ({ id, kind, title, feedbackCount }))
}

// Only what the screen shows of each hypothesis with a verdict, in the order the PM wrote them. Without a
// feedback linked the word is to_review, as in the Sintesi (VerdictWord in hypothesis-list.tsx).
export function roomVerdicts(hypotheses: Hypothesis[]): RoomVerdict[] {
  return hypotheses.flatMap(({ id, text, verdict: v }) =>
    v
      ? [
          {
            id,
            text,
            verdict: v.supporting + v.contradicting > 0 ? v.verdict : "to_review",
            supporting: v.supporting,
            contradicting: v.contradicting,
            feedbackRead: v.feedbackRead,
          },
        ]
      : []
  )
}
