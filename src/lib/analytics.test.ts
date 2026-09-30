import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"
import type { Milestone, RepeatedEvent } from "./analytics"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The milestones are recorded for real in the local database; only PostHog is fake.
// after() runs the callback at once, and the test waits for it.
const pending = vi.hoisted(() => ({ tasks: [] as Promise<unknown>[], ip: "203.0.113.50" }))
vi.mock("next/server", () => ({ after: (task: () => Promise<unknown>) => pending.tasks.push(task()) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": pending.ip }) }))

const { trackEvent, trackMilestone } = await import("./analytics")
const { submitFeedback } = await import("@/app/actions")

// Only PostHog is fake: Supabase keeps the real fetch.
const realFetch = globalThis.fetch
const posthog = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }))
// The paths of the calls to Supabase, to count what a public form response costs the database.
const supabaseCalls: string[] = []
vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input)
  if (url.startsWith("https://eu.i.posthog.com/")) return posthog(input, init)
  if (url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL!)) supabaseCalls.push(new URL(url).pathname)
  return realFetch(input, init)
})

let user: TestUser

beforeAll(async () => {
  user = await createTestUser("analytics")
})

afterAll(() => deleteTestUsers([user]))

beforeEach(async () => {
  vi.stubEnv("POSTHOG_KEY", "phc_test")
  posthog.mockClear()
  pending.tasks = []
  await admin.from("analytics_milestones").delete().eq("workspace_id", user.workspaceId)
})

async function settle() {
  await Promise.all(pending.tasks)
}

const sent = () => posthog.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string))

describe("trackMilestone", () => {
  it("sends nothing and records nothing without a key", async () => {
    vi.stubEnv("POSTHOG_KEY", "")
    trackMilestone(user.workspaceId, { event: "signed_up", properties: { method: "email" } })
    await settle()
    expect(pending.tasks).toHaveLength(0)
    expect(posthog).not.toHaveBeenCalled()
    const { count } = await admin
      .from("analytics_milestones")
      .select("event", { count: "exact", head: true })
      .eq("workspace_id", user.workspaceId)
    expect(count).toBe(0)
  })

  it("sends each event once per workspace, to PostHog EU, with only the workspace id and counts", async () => {
    const milestone = { event: "first_analysis_completed", properties: { feedback_count: 12, theme_count: 4 } } as const
    trackMilestone(user.workspaceId, milestone)
    trackMilestone(user.workspaceId, milestone)
    await settle()
    expect(posthog).toHaveBeenCalledTimes(1)
    expect(posthog.mock.calls[0][0]).toBe("https://eu.i.posthog.com/i/v0/e/")
    expect(sent()[0]).toEqual({
      api_key: "phc_test",
      event: "first_analysis_completed",
      distinct_id: user.workspaceId,
      timestamp: expect.any(String),
      properties: { feedback_count: 12, theme_count: 4, $process_person_profile: false, $geoip_disable: true },
    })
  })

  it("Milestone carries first_research_collected, with no properties", async () => {
    expectTypeOf<Extract<Milestone, { event: "first_research_collected" }>["properties"]>().toEqualTypeOf<
      Record<string, never>
    >()
    trackMilestone(user.workspaceId, { event: "first_research_collected", properties: {} })
    await settle()
    expect(sent()).toEqual([
      expect.objectContaining({
        event: "first_research_collected",
        properties: { $process_person_profile: false, $geoip_disable: true },
      }),
    ])
  })

  it("sends nothing when the workspace cannot be found", async () => {
    trackMilestone(async () => null, { event: "upgraded_to_pro", properties: {} })
    await settle()
    expect(posthog).not.toHaveBeenCalled()
  })

  it("never throws when PostHog fails: the error only reaches the logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    posthog.mockRejectedValueOnce(new TypeError("fetch failed"))
    expect(() => trackMilestone(user.workspaceId, { event: "signed_up", properties: { method: "google" } })).not.toThrow()
    await settle()
    expect(log).toHaveBeenCalledWith("PostHog: signed_up not sent,", "TypeError")
    log.mockRestore()
  })
})

describe("trackEvent", () => {
  it("RepeatedEvent carries research_synthesized with its three counts", async () => {
    expectTypeOf<Extract<RepeatedEvent, { event: "research_synthesized" }>["properties"]>().toEqualTypeOf<{
      feedback_count: number
      citation_count: number
      hypothesis_count: number
    }>()
    trackEvent(user.workspaceId, {
      event: "research_synthesized",
      properties: { feedback_count: 12, citation_count: 4, hypothesis_count: 0 },
    })
    await settle()
    expect(sent()[0]).toMatchObject({
      event: "research_synthesized",
      properties: { feedback_count: 12, citation_count: 4, hypothesis_count: 0, $process_person_profile: false, $geoip_disable: true },
    })
  })

  it("RepeatedEvent carries report_generated with three counts and no text", async () => {
    expectTypeOf<Extract<RepeatedEvent, { event: "report_generated" }>["properties"]>().toEqualTypeOf<{
      feedback_count: number
      theme_count: number
      hypothesis_count: number
    }>()
    trackEvent(user.workspaceId, {
      event: "report_generated",
      properties: { feedback_count: 200, theme_count: 8, hypothesis_count: 3 },
    })
    await settle()
    expect(sent()[0]).toMatchObject({
      event: "report_generated",
      properties: { feedback_count: 200, theme_count: 8, hypothesis_count: 3, $process_person_profile: false, $geoip_disable: true },
    })
  })

  it("sends question_answered with only citation_count and outcome", async () => {
    trackEvent(user.workspaceId, { event: "question_answered", properties: { citation_count: 3, outcome: "answered" } })
    await settle()
    expect(posthog).toHaveBeenCalledTimes(1)
    expect(posthog.mock.calls[0][0]).toBe("https://eu.i.posthog.com/i/v0/e/")
    expect(sent()[0]).toEqual({
      api_key: "phc_test",
      event: "question_answered",
      distinct_id: user.workspaceId,
      timestamp: expect.any(String),
      properties: { citation_count: 3, outcome: "answered", $process_person_profile: false, $geoip_disable: true },
    })
  })
})

describe("first feedback from the public form", () => {
  it("sends one event for many submissions at once, without the text or the email", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        submitFeedback({ slug: user.formSlug, text: `Testo segreto ${i}`, email: "cliente@esempio.it", website: "" })
      )
    )
    expect(results.every((r) => r.ok)).toBe(true)
    await settle()
    // Five responses also bring the Research to 5: first_research_collected leaves once too.
    expect(sent().map((b) => b.event).sort()).toEqual(["first_feedback_added", "first_research_collected"])
    const first = sent().find((b) => b.event === "first_feedback_added")
    expect(first).toMatchObject({ distinct_id: user.workspaceId })
    expect(first.properties).toEqual({ source: "form", $process_person_profile: false, $geoip_disable: true })
    const body = JSON.stringify(sent())
    expect(body).not.toContain("segreto")
    expect(body).not.toContain("cliente@")
  })

  // A full room sends hundreds of responses in a minute to a database on the Free plan of Supabase: each
  // response costs it the submission and one call for both milestones, even once they are sent.
  it("costs the database two calls per response: the submission and one claim of the milestones", async () => {
    for (let i = 0; i < 5; i++) await submitFeedback({ slug: user.formSlug, text: `Dalla sala ${i}`, email: "", website: "" })
    await settle()
    expect(sent().map((b) => b.event).sort()).toEqual(["first_feedback_added", "first_research_collected"])
    pending.tasks = []
    posthog.mockClear()
    supabaseCalls.length = 0
    expect(await submitFeedback({ slug: user.formSlug, text: "Un altro", email: "", website: "" })).toEqual({ ok: true })
    await settle()
    expect(supabaseCalls).toEqual(["/rest/v1/rpc/submit_public_feedback", "/rest/v1/rpc/claim_form_milestones"])
    expect(posthog).not.toHaveBeenCalled()
  })
})
