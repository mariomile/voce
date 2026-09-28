"use server"

import { NoObjectGeneratedError } from "ai"
import { z } from "zod"
import {
  ANALYSIS_MAX_FEEDBACK,
  ANALYSIS_WINDOW_DAYS,
  analysisLanguageModel,
  analysisModel,
  estimateCost,
  type AnalysisFeedback,
} from "@/lib/analysis"
import { trackEvent } from "@/lib/analytics"
import { getCurrentWorkspace, getUsage } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { QUESTION_INSTRUCTIONS, QUESTION_MAX_LENGTH, normalizeQuestion, questionPrompt, runQuestion } from "@/lib/questions"
import { failQuestion, finishQuestion, questionUsage, startQuestion } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Plan } from "@/lib/types"

// Only the question: the workspace always comes from the session.
const askSchema = z.strictObject({ question: z.string() })

export type AskQuote = { text: string; highlight: string; channel: string; receivedAt: string }
export type AskUsage = { used: number; quota: number }

export type AskResult =
  | {
      ok: true
      outcome: "answered"
      question: string
      answer: string
      // Distinct existing feedback the model linked, counted by the server.
      feedbackCount: number
      feedbackConsidered: number
      feedbackInWindow: number
      quotes: AskQuote[]
      // Null only if the quota could not be read after the question was already answered: the
      // answer is still shown, the quota note on screen is simply left as it was.
      usage: AskUsage | null
    }
  | {
      ok: true
      outcome: "no_evidence"
      question: string
      feedbackConsidered: number
      feedbackInWindow: number
      usage: AskUsage | null
    }
  | { ok: false; reason: "invalid" | "session" | "no_feedback" | "busy" }
  | { ok: false; reason: "limit"; usage: AskUsage; plan: Plan }
  | { ok: false; reason: "failed"; usage: AskUsage }

// One question, one answer. The feedback are read as the signed-in user, so RLS limits them to their
// workspace; the question is reserved by the database (quota, one at a time) before the model is
// called, and closed there after the quotes are checked again. The answer is returned, never saved
// for the user.
export async function ask(input: z.input<typeof askSchema>): Promise<AskResult> {
  const parsed = askSchema.safeParse(input)
  const question = parsed.success ? normalizeQuestion(parsed.data.question.replaceAll("\0", "")) : ""
  if (!question || question.length > QUESTION_MAX_LENGTH) return { ok: false, reason: "invalid" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const workspace = await getCurrentWorkspace()

  // The same feedback as the analysis: the last 90 days, today included, at most 500, newest first.
  const since = new Date(Date.parse(isoDateOf(new Date())) - (ANALYSIS_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const rows = await supabase
    .from("feedback")
    .select("id, text, channel, received_at", { count: "exact" })
    .eq("workspace_id", workspace.id)
    .gte("received_at", since)
    .order("received_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(ANALYSIS_MAX_FEEDBACK)
  if (rows.error) throw rows.error
  if (rows.data.length === 0) return { ok: false, reason: "no_feedback" }
  const feedback: AnalysisFeedback[] = rows.data.map((f) => ({
    id: f.id,
    text: f.text,
    channel: f.channel,
    receivedAt: f.received_at,
  }))
  const feedbackInWindow = rows.count ?? feedback.length

  const modelId = analysisModel()
  const start = await startQuestion({
    workspaceId: workspace.id,
    model: modelId,
    feedbackConsidered: feedback.length,
    input: {
      instructions: QUESTION_INSTRUCTIONS,
      prompt: questionPrompt(question, feedback),
      feedback_ids: feedback.map((f) => f.id),
    },
  })
  if (start.outcome === "limit") {
    // Read fresh: the plan or the quota can have changed since the page was rendered (upgrade
    // from another tab, month rollover), and the notice on screen must match what the server saw.
    const fresh = await getUsage(workspace.id)
    return { ok: false, reason: "limit", usage: { used: fresh.questionsThisMonth, quota: fresh.questionsLimit }, plan: fresh.plan }
  }
  if (start.outcome !== "ok") return { ok: false, reason: start.outcome }

  const started = performance.now()
  try {
    const result = await runQuestion({ model: analysisLanguageModel(), modelId, question, feedback })
    const kept = await finishQuestion(start.questionId, result.feedbackIds.length, result.quotes, {
      output: result.raw,
      issues: result.issues,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      duration_ms: result.durationMs,
      cost_usd: result.costUsd,
    })
    const outcome = kept.length > 0 ? "answered" : "no_evidence"
    trackEvent(workspace.id, { event: "question_answered", properties: { citation_count: kept.length, outcome } })
    // The question is already closed at this point: a failure reading the quota must not turn an
    // answered question into "the answer did not arrive". The quota note is simply left out.
    const usage = await questionUsage(workspace.id).catch(() => null)
    if (outcome === "no_evidence")
      return { ok: true, outcome, question, feedbackConsidered: feedback.length, feedbackInWindow, usage }
    return {
      ok: true,
      outcome,
      question,
      answer: result.answer,
      feedbackCount: result.feedbackIds.length,
      feedbackConsidered: feedback.length,
      feedbackInWindow,
      quotes: kept.map((q) => {
        const f = feedback.find((f) => f.id === q.feedbackId)!
        return { text: f.text, highlight: q.text, channel: f.channel, receivedAt: f.receivedAt }
      }),
      usage,
    }
  } catch (error) {
    // Only the error name and the question id reach the logs: messages can carry feedback text.
    console.error(`Question ${start.questionId} failed:`, error instanceof Error ? error.name : "unknown")
    const failed = NoObjectGeneratedError.isInstance(error) ? error : null
    await failQuestion(start.questionId, errorMessage(error), {
      output: failed?.text ?? null,
      input_tokens: failed?.usage?.inputTokens,
      output_tokens: failed?.usage?.outputTokens,
      duration_ms: Math.round(performance.now() - started),
      cost_usd: failed ? estimateCost(modelId, failed.usage?.inputTokens, failed.usage?.outputTokens) : null,
    }).catch(() => {
      // The question stays "running", is closed as stale after 5 minutes, and counts.
      console.error(`Question ${start.questionId} could not be marked as failed`)
    })
    return { ok: false, reason: "failed", usage: await questionUsage(workspace.id) }
  }
}

function errorMessage(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return text.slice(0, 2000)
}
