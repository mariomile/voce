import "server-only"

import { createHmac } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/lib/database.types"
import type { CheckedTheme } from "@/lib/analysis"
import type { Milestone } from "@/lib/analytics"
import type { BillingState } from "@/lib/billing"

// The secret key bypasses RLS, so it does only what the server alone may do: send a public form
// submission with the visitor IP it sees, reserve, save or fail an AI analysis or a question, and write the billing
// data from Stripe, and record which analytics events a workspace has sent. If users could do those,
// they could skip the rate limits, write fake themes and costs, or give themselves Pro.

function adminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function sendPublicFeedback(input: {
  slug: string
  text: string
  email: string
  clientIp: string
}): Promise<"ok" | "invalid" | "unavailable" | "rate_limited"> {
  const { data, error } = await adminClient().rpc("submit_public_feedback", {
    slug: input.slug,
    feedback_text: input.text,
    email: input.email,
    // Keyed hash: the database never sees the IP, and cannot turn the hash back into one.
    client_ip: createHmac("sha256", process.env.SUPABASE_SECRET_KEY!).update(input.clientIp).digest("hex"),
  })
  if (error) throw error
  if (data === "ok" || data === "invalid" || data === "unavailable" || data === "rate_limited") return data
  throw new Error(`Unexpected public form result: ${data}`)
}

// The workspace id must come from the signed-in user's session: this call does not check membership.
export async function startAnalysis(input: {
  workspaceId: string
  model: string
  periodStart: string
  feedbackCount: number
  input: Json
}): Promise<{ outcome: "ok"; analysisId: string } | { outcome: "busy" | "limit" }> {
  const { data, error } = await adminClient().rpc("start_analysis", {
    ws: input.workspaceId,
    model: input.model,
    period_start: input.periodStart,
    feedback_count: input.feedbackCount,
    input: input.input,
  })
  if (error) throw error
  const row = data[0]
  if (row?.outcome === "ok" && row.analysis_id) return { outcome: "ok", analysisId: row.analysis_id }
  if (row?.outcome === "busy" || row?.outcome === "limit") return { outcome: row.outcome }
  throw new Error(`Unexpected start_analysis result: ${JSON.stringify(data)}`)
}

export type RunLog = {
  output?: Json
  issues?: Json
  input_tokens?: number
  output_tokens?: number
  duration_ms?: number
  cost_usd?: number | null
}

export async function finishAnalysis(analysisId: string, themes: CheckedTheme[], run: RunLog) {
  const { error } = await adminClient().rpc("finish_analysis", {
    analysis: analysisId,
    themes: themes.map((t) => ({
      title: t.title,
      summary: t.summary,
      kind: t.kind,
      sentiment: t.sentiment,
      feedback: t.feedback,
      quotes: t.quotes.map((q) => ({ feedback_id: q.feedbackId, text: q.text })),
    })),
    run,
  })
  if (error) throw error
}

export async function failAnalysis(analysisId: string, message: string, run: RunLog) {
  const { error } = await adminClient().rpc("fail_analysis", { analysis: analysisId, error: message, run })
  if (error) throw error
}

// Questions to the feedback. Same rules as the analysis: the workspace id must come from the
// signed-in user's session, and only the server reserves, closes or fails a question.
export async function startQuestion(input: {
  workspaceId: string
  model: string
  feedbackConsidered: number
  input: Json
}): Promise<{ outcome: "ok"; questionId: string } | { outcome: "busy" | "limit" }> {
  const { data, error } = await adminClient().rpc("start_question", {
    ws: input.workspaceId,
    model: input.model,
    feedback_considered: input.feedbackConsidered,
    input: input.input,
  })
  if (error) throw error
  const row = data[0]
  if (row?.outcome === "ok" && row.question_id) return { outcome: "ok", questionId: row.question_id }
  if (row?.outcome === "busy" || row?.outcome === "limit") return { outcome: row.outcome }
  throw new Error(`Unexpected start_question result: ${JSON.stringify(data)}`)
}

// Returns the quotes kept after the database checked them again against the saved feedback.
export async function finishQuestion(
  questionId: string,
  feedbackCount: number,
  quotes: { feedbackId: string; text: string }[],
  run: RunLog
): Promise<{ feedbackId: string; text: string }[]> {
  const { data, error } = await adminClient().rpc("finish_question", {
    question: questionId,
    feedback_count: feedbackCount,
    quotes: quotes.map((q) => ({ feedback_id: q.feedbackId, text: q.text })),
    run,
  })
  if (error) throw error
  return (data as { feedback_id: string; text: string }[]).map((q) => ({ feedbackId: q.feedback_id, text: q.text }))
}

export async function failQuestion(questionId: string, message: string, run: RunLog) {
  const { error } = await adminClient().rpc("fail_question", { question: questionId, error: message, run })
  if (error) throw error
}

// Users cannot read the questions table: the server counts them for the session's workspace.
export async function questionUsage(workspaceId: string) {
  const { data, error } = await adminClient().rpc("question_usage", { ws: workspaceId })
  if (error) throw error
  return { used: data[0].used, quota: data[0].quota }
}

// The workspace id must come from the signed-in user's session. Sets the Stripe customer only once:
// if two clicks both created one, the first saved wins and both use it.
export async function saveStripeCustomer(workspaceId: string, customerId: string) {
  const client = adminClient()
  const { error } = await client
    .from("subscriptions")
    .update({ stripe_customer_id: customerId })
    .eq("workspace_id", workspaceId)
    .is("stripe_customer_id", null)
  if (error) throw error
  const { data, error: readError } = await client
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspaceId)
    .single()
  if (readError) throw readError
  return data.stripe_customer_id!
}

// Only the Stripe webhook calls this. Skips the write when a read that started later is already saved:
// one update, so Postgres checks the time again after waiting for a write running at the same moment.
// Returns "unknown_customer" when no workspace has this customer, and the workspace when saved.
export async function saveBilling(customerId: string, state: BillingState, readAt: Date) {
  const client = adminClient()
  const { data, error } = await client
    .from("subscriptions")
    .update({
      plan: state.plan,
      stripe_subscription_id: state.stripeSubscriptionId,
      stripe_status: state.stripeStatus,
      current_period_end: state.currentPeriodEnd,
      cancel_at: state.cancelAt,
      stripe_synced_at: readAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId)
    .or(`stripe_synced_at.is.null,stripe_synced_at.lte.${readAt.toISOString()}`)
    .select("workspace_id")
  if (error) throw error
  if (data.length > 0) return { outcome: "saved" as const, workspaceId: data[0].workspace_id }
  const { count, error: countError } = await client
    .from("subscriptions")
    .select("workspace_id", { count: "exact", head: true })
    .eq("stripe_customer_id", customerId)
  if (countError) throw countError
  return { outcome: count ? ("stale" as const) : ("unknown_customer" as const) }
}

// True only for the call that records the event first: that one sends it.
export async function claimMilestone(workspaceId: string, event: Milestone["event"]) {
  const { data, error } = await adminClient()
    .from("analytics_milestones")
    .upsert({ workspace_id: workspaceId, event }, { onConflict: "workspace_id,event", ignoreDuplicates: true })
    .select("workspace_id")
  if (error) throw error
  return data.length > 0
}

// Today every user owns exactly one workspace.
export async function workspaceOfUser(userId: string) {
  const { data, error } = await adminClient()
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle()
  if (error) throw error
  return data?.workspace_id ?? null
}

// The workspace of the Research whose public form has this link.
export async function workspaceOfForm(slug: string) {
  const { data, error } = await adminClient().from("research").select("workspace_id").eq("form_slug", slug).maybeSingle()
  if (error) throw error
  return data?.workspace_id ?? null
}

// The workspace of a Research (by id, or by the link of its public form) once it has at least 5 feedback.
// Null before: first_research_collected is not due yet.
export const COLLECTED_FEEDBACK = 5
export async function workspaceOfCollectedResearch(research: { id: string } | { slug: string }) {
  const client = adminClient()
  const query = client.from("research").select("id, workspace_id")
  const { data, error } = await ("id" in research ? query.eq("id", research.id) : query.eq("form_slug", research.slug)).maybeSingle()
  if (error) throw error
  if (!data) return null
  const { count, error: countError } = await client
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", data.workspace_id)
    .eq("research_id", data.id)
  if (countError) throw countError
  return (count ?? 0) >= COLLECTED_FEEDBACK ? data.workspace_id : null
}
