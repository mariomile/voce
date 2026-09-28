"use server"

import { NoObjectGeneratedError } from "ai"
import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import {
  ANALYSIS_MAX_FEEDBACK,
  ANALYSIS_WINDOW_DAYS,
  analysisInstructions,
  analysisLanguageModel,
  analysisModel,
  buildPrompt,
  estimateCost,
  runAnalysis,
  type AnalysisFeedback,
} from "@/lib/analysis"
import { trackMilestone } from "@/lib/analytics"
import { getCurrentWorkspace } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { failAnalysis, finishAnalysis, startAnalysis } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type AnalyzeResult =
  | { ok: true }
  | { ok: false; reason: "no_feedback" | "busy" | "limit" | "no_themes" | "failed" }

// Reads run as the signed-in user, so RLS limits them to their workspace. The quota is checked
// and the analysis reserved by the database before the model is called; the themes of the
// previous analysis stay until the new one is saved in full.
export async function analyze(): Promise<AnalyzeResult> {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  // Titles and summaries are written in the language the PM is using right now.
  const locale = await getLocale()

  const today = isoDateOf(new Date())
  // The last 90 days, today included.
  const since = new Date(Date.parse(today) - (ANALYSIS_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [feedbackRows, latest] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, text, channel, received_at")
      .eq("workspace_id", workspace.id)
      .gte("received_at", since)
      .order("received_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ANALYSIS_MAX_FEEDBACK),
    supabase
      .from("analyses")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (feedbackRows.error) throw feedbackRows.error
  if (latest.error) throw latest.error
  if (feedbackRows.data.length === 0) return { ok: false, reason: "no_feedback" }

  const feedback: AnalysisFeedback[] = feedbackRows.data.map((f) => ({
    id: f.id,
    text: f.text,
    channel: f.channel,
    receivedAt: f.received_at,
  }))
  let existingTitles: string[] = []
  if (latest.data) {
    const themes = await supabase
      .from("themes")
      .select("title")
      .eq("workspace_id", workspace.id)
      .eq("analysis_id", latest.data.id)
    if (themes.error) throw themes.error
    existingTitles = themes.data.map((t) => t.title)
  }

  const modelId = analysisModel()
  const start = await startAnalysis({
    workspaceId: workspace.id,
    model: modelId,
    periodStart: feedback.reduce((min, f) => (f.receivedAt < min ? f.receivedAt : min), today),
    feedbackCount: feedback.length,
    input: {
      instructions: analysisInstructions(locale),
      prompt: buildPrompt(feedback, existingTitles),
      feedback_ids: feedback.map((f) => f.id),
    },
  })
  if (start.outcome !== "ok") return { ok: false, reason: start.outcome }

  const started = performance.now()
  let themeCount: number
  try {
    const result = await runAnalysis({ model: analysisLanguageModel(), modelId, feedback, existingTitles, locale })
    const run = {
      output: result.raw,
      issues: result.issues,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      duration_ms: result.durationMs,
      cost_usd: result.costUsd,
    }
    // No theme left: the previous analysis stays, with the priorities and statuses the PM gave it.
    if (result.themes.length === 0) {
      await failAnalysis(start.analysisId, "no_themes", run)
      return { ok: false, reason: "no_themes" }
    }
    await finishAnalysis(start.analysisId, result.themes, run)
    themeCount = result.themes.length
  } catch (error) {
    // Only the error name reaches the logs: messages can carry feedback text.
    console.error(`Analysis ${start.analysisId} failed:`, error instanceof Error ? error.name : "unknown")
    const failed = NoObjectGeneratedError.isInstance(error) ? error : null
    await failAnalysis(start.analysisId, errorMessage(error), {
      output: failed?.text ?? null,
      input_tokens: failed?.usage?.inputTokens,
      output_tokens: failed?.usage?.outputTokens,
      duration_ms: Math.round(performance.now() - started),
      cost_usd: failed ? estimateCost(modelId, failed.usage?.inputTokens, failed.usage?.outputTokens) : null,
    }).catch(() => {
      // The analysis stays "running" and is closed as stale after 10 minutes.
      console.error(`Analysis ${start.analysisId} could not be marked as failed`)
    })
    return { ok: false, reason: "failed" }
  }

  trackMilestone(workspace.id, {
    event: "first_analysis_completed",
    properties: { feedback_count: feedback.length, theme_count: themeCount },
  })
  revalidatePath("/", "layout")
  return { ok: true }
}

function errorMessage(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return text.slice(0, 2000)
}
