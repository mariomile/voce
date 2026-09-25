import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { admin, createTestUser, deleteTestUsers, type TestUser } from "@/test/supabase"

// The milestones are recorded for real in the local database; only PostHog is fake.
// after() runs the callback at once, and the test waits for it.
const pending = vi.hoisted(() => ({ tasks: [] as Promise<unknown>[], ip: "203.0.113.50" }))
vi.mock("next/server", () => ({ after: (task: () => Promise<unknown>) => pending.tasks.push(task()) }))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": pending.ip }) }))

const { trackMilestone } = await import("./analytics")
const { submitFeedback } = await import("@/app/actions")

// Only PostHog is fake: Supabase keeps the real fetch.
const realFetch = globalThis.fetch
const posthog = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }))
vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) =>
  String(input).startsWith("https://eu.i.posthog.com/") ? posthog(input, init) : realFetch(input, init)
)

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

describe("first feedback from the public form", () => {
  it("sends one event for many submissions at once, without the text or the email", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        submitFeedback({ slug: user.formSlug, text: `Testo segreto ${i}`, email: "cliente@esempio.it", website: "" })
      )
    )
    expect(results.every((r) => r.ok)).toBe(true)
    await settle()
    expect(sent()).toEqual([expect.objectContaining({ event: "first_feedback_added", distinct_id: user.workspaceId })])
    expect(sent()[0].properties).toEqual({ source: "form", $process_person_profile: false, $geoip_disable: true })
    const body = JSON.stringify(sent())
    expect(body).not.toContain("segreto")
    expect(body).not.toContain("cliente@")
  })
})
