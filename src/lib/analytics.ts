import "server-only"

import { after } from "next/server"
import { claimMilestone } from "./supabase/admin"

// Events for PostHog, sent from the server only: no script in the browser, no cookies.
// Activation milestones leave once per workspace, question_answered at every answer; the workspace id
// is the only identity. Properties are categories and counts: never feedback text, question or answer
// text, names, emails or IPs. Documented in docs/analytics.md.
// Without POSTHOG_KEY nothing is sent. Errors only reach the logs: users never see them.

const CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/"

export type Milestone =
  | { event: "signed_up"; properties: { method: "email" | "google" } }
  | { event: "first_feedback_added"; properties: { source: "manual" | "csv" | "form" } }
  | { event: "first_analysis_completed"; properties: { feedback_count: number; theme_count: number } }
  | { event: "upgraded_to_pro"; properties: Record<string, never> }

// Repeatable events: sent every time, without analytics_milestones.
export type RepeatedEvent = {
  event: "question_answered"
  properties: { citation_count: number; outcome: "answered" | "no_evidence" }
}

type Event = Milestone | RepeatedEvent

// Where the workspace id is not at hand, pass a function that finds it: it runs only with a key.
export function trackMilestone(workspace: string | (() => Promise<string | null>), milestone: Milestone) {
  send(milestone, async () => {
    const workspaceId = typeof workspace === "string" ? workspace : await workspace()
    if (!workspaceId || !(await claimMilestone(workspaceId, milestone.event))) return null
    return workspaceId
  })
}

export function trackEvent(workspaceId: string, event: RepeatedEvent) {
  send(event, async () => workspaceId)
}

// The one place that builds the request to PostHog.
function send(event: Event, workspaceToSend: () => Promise<string | null>) {
  const key = process.env.POSTHOG_KEY
  if (!key) return
  const timestamp = new Date().toISOString()
  // After the response: the user never waits for PostHog.
  after(async () => {
    try {
      const workspaceId = await workspaceToSend()
      if (!workspaceId) return
      const response = await fetch(CAPTURE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          event: event.event,
          distinct_id: workspaceId,
          timestamp,
          properties: { ...event.properties, $process_person_profile: false, $geoip_disable: true },
        }),
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) console.error(`PostHog: ${event.event} not sent, status ${response.status}`)
    } catch (error) {
      console.error(`PostHog: ${event.event} not sent,`, error instanceof Error ? error.name : "unknown")
    }
  })
}
