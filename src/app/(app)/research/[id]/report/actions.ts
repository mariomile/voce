"use server"

import { NoObjectGeneratedError } from "ai"
import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import { analysisLanguageModel, analysisModel, estimateCost } from "@/lib/analysis"
import { trackEvent } from "@/lib/analytics"
import { getReportSource, getResearch } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { buildReportPrompt, reportInstructions, runReport } from "@/lib/report"
import { failAnalysis, finishReport, startAnalysis } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type ReportResult =
  | { ok: true }
  | { ok: false; reason: "session" | "not_found" | "no_synthesis" | "busy" | "limit" | "failed" }

// "Genera il report" and "Rigenera": one model call over the last synthesis of the Research. Reads run as the
// signed-in user, so RLS limits them to their workspace: a Research of another workspace is not found, and
// nothing is sent to the model. The database reserves the report as 1 analysis of the plan (quota, one at a time
// per workspace) before the model is called, checks its quotes again and saves it; a failed report does not
// count. The report is written in the language the PM is using right now.
export async function generateReport(researchId: string): Promise<ReportResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const research = await getResearch(researchId)
  if (!research) return { ok: false, reason: "not_found" }
  const source = await getReportSource(research)
  if (!source || source.themes.length === 0) return { ok: false, reason: "no_synthesis" }

  const locale = await getLocale()
  const modelId = analysisModel()
  const start = await startAnalysis({
    workspaceId: research.workspaceId,
    researchId: research.id,
    model: modelId,
    kinds: ["report"],
    periodStart: source.firstReceivedAt || isoDateOf(new Date()),
    feedbackCount: source.feedbackTotal,
    inputs: {
      report: {
        instructions: reportInstructions(locale),
        prompt: buildReportPrompt(source),
        source_analysis_id: source.synthesis.analysisId,
        feedback_ids: source.sample.map((f) => f.feedbackId),
      },
    },
  })
  if (start.outcome !== "ok") return { ok: false, reason: start.outcome }
  const analysisId = start.analyses.report!

  const started = performance.now()
  try {
    const result = await runReport({ model: analysisLanguageModel(), modelId, source, locale })
    await finishReport({
      analysisId,
      sourceAnalysisId: source.synthesis.analysisId,
      locale,
      content: result.content,
      feedbackCount: source.feedbackTotal,
      run: {
        output: result.raw,
        issues: result.issues,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        duration_ms: result.durationMs,
        cost_usd: result.costUsd,
      },
    })
  } catch (error) {
    // Only the error name reaches the logs: messages can carry feedback text.
    console.error(`Report ${analysisId} failed:`, error instanceof Error ? error.name : "unknown")
    const failed = NoObjectGeneratedError.isInstance(error) ? error : null
    await failAnalysis(analysisId, errorMessage(error), {
      output: failed?.text ?? null,
      input_tokens: failed?.usage?.inputTokens,
      output_tokens: failed?.usage?.outputTokens,
      duration_ms: Math.round(performance.now() - started),
      cost_usd: failed ? estimateCost(modelId, failed.usage?.inputTokens, failed.usage?.outputTokens) : null,
    }).catch(() => {
      // The report stays "running" and is closed as stale after 10 minutes.
      console.error(`Report ${analysisId} could not be marked as failed`)
    })
    return { ok: false, reason: "failed" }
  }

  trackEvent(research.workspaceId, {
    event: "report_generated",
    properties: {
      feedback_count: source.synthesis.feedbackRead,
      theme_count: source.themes.length,
      hypothesis_count: source.hypotheses.length,
    },
  })
  revalidatePath(`/research/${research.id}/report`)
  return { ok: true }
}

// A database error (research_deleted, quote_not_in_feedback) comes as a plain object with a message.
function errorMessage(error: unknown) {
  const text =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
        ? error.message
        : String(error)
  return text.slice(0, 2000)
}
