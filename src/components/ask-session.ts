import { useSyncExternalStore } from "react"
import type { AskResult } from "@/app/(app)/research/[id]/ask/actions"
import type { AskOutcome } from "@/components/ask-format"

// The questions of this visit to a Research, kept in the browser's memory and nowhere else: they stay
// while the PM moves between the tabs of the app, and go away when the page is reloaded. Never saved in
// the database. Also holds the question in flight, so leaving the tab and coming back still shows it
// and still blocks a second one.

export type AskEntry = { id: number; result: AskOutcome }
export type AskSession = { entries: AskEntry[]; pending: { question: string; startedAt: number } | null }

const EMPTY: AskSession = { entries: [], pending: null }
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
  set(researchId, { ...askSession(researchId), pending: { question, startedAt: Date.now() } })
}

// The answer goes on top; a failure only clears the question in flight.
export function endAsking(researchId: string, result: Extract<AskResult, { ok: true }> | null) {
  const { entries } = askSession(researchId)
  if (!result) return set(researchId, { entries, pending: null })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ok, usage, ...outcome } = result
  set(researchId, { entries: [{ id: nextId++, result: outcome }, ...entries], pending: null })
}
