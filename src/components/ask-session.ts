import { useSyncExternalStore } from "react"
import type { AskResult, AskUsage } from "@/app/(app)/research/[id]/ask/actions"
import type { AskOutcome } from "@/components/ask-format"
import type { Plan } from "@/lib/types"

// The questions of this visit to a Research, kept in the browser's memory and nowhere else: they stay
// while the PM moves between the tabs of the app, and go away when the page is reloaded. Never saved in
// the database. Also holds the question in flight, so leaving the tab and coming back still shows it
// and still blocks a second one.

export type AskEntry = { id: number; result: AskOutcome }
export type AskFailure = Extract<AskResult, { ok: false }>["reason"] | "network"
// A question that failed while the tab was not on screen: the form shows it, and puts the question
// back in the field, when the PM comes back.
export type MissedFailure = { question: string; failure: AskFailure; usage?: AskUsage; plan?: Plan }
export type AskSession = {
  entries: AskEntry[]
  pending: { question: string; startedAt: number } | null
  missed: MissedFailure | null
}

const EMPTY: AskSession = { entries: [], pending: null, missed: null }
const sessions = new Map<string, AskSession>()
const listeners = new Set<() => void>()
let nextId = 1

function set(researchId: string, session: AskSession) {
  sessions.set(researchId, session)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAskSession(researchId: string) {
  return useSyncExternalStore(
    subscribe,
    () => sessions.get(researchId) ?? EMPTY,
    () => EMPTY
  )
}

export function askSession(researchId: string) {
  return sessions.get(researchId) ?? EMPTY
}

export function beginAsking(researchId: string, question: string) {
  set(researchId, { ...askSession(researchId), pending: { question, startedAt: Date.now() }, missed: null })
}

// The answer goes on top. A failure clears the question in flight; missed is set only when no form
// was on screen to show it.
export function endAsking(
  researchId: string,
  result: Extract<AskResult, { ok: true }> | MissedFailure,
  onScreen: boolean
) {
  const { entries } = askSession(researchId)
  if ("failure" in result) return set(researchId, { entries, pending: null, missed: onScreen ? null : result })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ok, usage, ...outcome } = result
  set(researchId, { entries: [{ id: nextId++, result: outcome }, ...entries], pending: null, missed: null })
}

export function clearMissed(researchId: string) {
  const session = askSession(researchId)
  if (session.missed) set(researchId, { ...session, missed: null })
}
