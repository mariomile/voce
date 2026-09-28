"use server"

import { NoObjectGeneratedError } from "ai"
import { revalidatePath } from "next/cache"
import { getLocale } from "next-intl/server"
import { z } from "zod"
import {
  ANALYSIS_MAX_FEEDBACK,
  analysisInstructions,
  analysisLanguageModel,
  analysisModel,
  buildPrompt,
  estimateCost,
  runAnalysis,
  selectFeedback,
  type AnalysisFeedback,
} from "@/lib/analysis"
import { trackEvent, trackMilestone } from "@/lib/analytics"
import { getResearch } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { HYPOTHESIS_MAX_LENGTH } from "@/lib/plans"
import { failAnalysis, finishAnalysis, startAnalysis } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type SynthesizeResult =
  | { ok: true; themeCount: number }
  | { ok: false; reason: "no_feedback" | "busy" | "limit" | "no_themes" | "failed" | "session" | "not_found" }

// One click on "Analizza": the themes of this Research. Reads run as the signed-in user, so RLS limits
// them to their workspace: a Research of another workspace is not found, and nothing is sent to the model.
// The database reserves the analysis (quota, one at a time per workspace) before the model is called;
// the themes of the previous analysis stay until the new one is saved in full. Used by the Sintesi and
// by the room screen.
export async function synthesize(researchId: string): Promise<SynthesizeResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const research = await getResearch(researchId)
  if (!research) return { ok: false, reason: "not_found" }
  // Titles and summaries are written in the language the PM is using right now.
  const locale = await getLocale()

  const [feedbackRows, latest] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, text, channel, received_at")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("received_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ANALYSIS_MAX_FEEDBACK),
    supabase
      .from("analyses")
      .select("id")
      .eq("research_id", research.id)
      .eq("kind", "themes")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (feedbackRows.error) throw feedbackRows.error
  if (latest.error) throw latest.error

  const feedback: AnalysisFeedback[] = selectFeedback(feedbackRows.data).map((f) => ({
    id: f.id,
    text: f.text,
    channel: f.channel,
    receivedAt: f.received_at,
  }))
  if (feedback.length === 0) return { ok: false, reason: "no_feedback" }

  let existingTitles: string[] = []
  if (latest.data) {
    const themes = await supabase.from("themes").select("title").eq("analysis_id", latest.data.id)
    if (themes.error) throw themes.error
    existingTitles = themes.data.map((t) => t.title)
  }

  const modelId = analysisModel()
  const today = isoDateOf(new Date())
  const start = await startAnalysis({
    workspaceId: research.workspaceId,
    researchId: research.id,
    model: modelId,
    // The verdict joins the themes when the Research has hypotheses; until then only the themes run.
    kinds: ["themes"],
    periodStart: feedback.reduce((min, f) => (f.receivedAt < min ? f.receivedAt : min), today),
    feedbackCount: feedback.length,
    inputs: {
      themes: {
        instructions: analysisInstructions(locale),
        prompt: buildPrompt(feedback, existingTitles),
        feedback_ids: feedback.map((f) => f.id),
      },
    },
  })
  if (start.outcome !== "ok") return { ok: false, reason: start.outcome }
  const analysisId = start.analyses.themes!

  const started = performance.now()
  let themeCount: number
  let citationCount: number
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
      await failAnalysis(analysisId, "no_themes", run)
      return { ok: false, reason: "no_themes" }
    }
    citationCount = await finishAnalysis(analysisId, result.themes, run)
    themeCount = result.themes.length
  } catch (error) {
    // Only the error name reaches the logs: messages can carry feedback text.
    console.error(`Analysis ${analysisId} failed:`, error instanceof Error ? error.name : "unknown")
    const failed = NoObjectGeneratedError.isInstance(error) ? error : null
    await failAnalysis(analysisId, errorMessage(error), {
      output: failed?.text ?? null,
      input_tokens: failed?.usage?.inputTokens,
      output_tokens: failed?.usage?.outputTokens,
      duration_ms: Math.round(performance.now() - started),
      cost_usd: failed ? estimateCost(modelId, failed.usage?.inputTokens, failed.usage?.outputTokens) : null,
    }).catch(() => {
      // The analysis stays "running" and is closed as stale after 10 minutes.
      console.error(`Analysis ${analysisId} could not be marked as failed`)
    })
    return { ok: false, reason: "failed" }
  }

  trackMilestone(research.workspaceId, {
    event: "first_analysis_completed",
    properties: { feedback_count: feedback.length, theme_count: themeCount },
  })
  trackEvent(research.workspaceId, {
    event: "research_synthesized",
    properties: { feedback_count: feedback.length, citation_count: citationCount, hypothesis_count: 0 },
  })
  revalidatePath("/", "layout")
  return { ok: true, themeCount }
}

function errorMessage(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return text.slice(0, 2000)
}

export type HypothesisResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "too_long" | "max_reached" | "failed" | "session" }

// The text of a hypothesis as the database will keep it, or why not.
function cleanHypothesis(text: unknown): { ok: true; text: string } | { ok: false; reason: "invalid" | "too_long" } {
  const parsed = z.string().safeParse(text)
  // Postgres text cannot hold NUL characters.
  const clean = parsed.success ? parsed.data.replaceAll("\0", "").trim() : ""
  if (!clean) return { ok: false, reason: "invalid" }
  // Counted like char_length in the database: characters, not UTF-16 units.
  if ([...clean].length > HYPOTHESIS_MAX_LENGTH) return { ok: false, reason: "too_long" }
  return { ok: true, text: clean }
}

// Writes run as the signed-in user: RLS keeps them to their workspace, and the database trigger counts
// the hypotheses of the Research one writer at a time (at most 5) and sets position and written_at.
export async function addHypothesis(researchId: string, text: string): Promise<HypothesisResult> {
  const clean = cleanHypothesis(text)
  if (!clean.ok) return clean
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const research = await getResearch(researchId)
  if (!research) return { ok: false, reason: "failed" }

  const { error } = await supabase
    .from("research_hypotheses")
    .insert({ workspace_id: research.workspaceId, research_id: research.id, text: clean.text })
  if (error) {
    if (error.message === "max_hypotheses") return { ok: false, reason: "max_reached" }
    console.error("addHypothesis failed", error.code)
    return { ok: false, reason: "failed" }
  }
  revalidatePath(`/research/${research.id}`)
  return { ok: true }
}

// A new text removes the verdict and restarts written_at: the database trigger does both.
export async function updateHypothesis(hypothesisId: string, text: string): Promise<HypothesisResult> {
  const clean = cleanHypothesis(text)
  if (!clean.ok) return clean
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  if (!z.uuid().safeParse(hypothesisId).success) return { ok: false, reason: "failed" }

  const { data, error } = await supabase
    .from("research_hypotheses")
    .update({ text: clean.text })
    .eq("id", hypothesisId)
    .select("research_id")
    .maybeSingle()
  if (error) console.error("updateHypothesis failed", error.code)
  if (error || !data) return { ok: false, reason: "failed" }
  revalidatePath(`/research/${data.research_id}`)
  return { ok: true }
}

export async function deleteHypothesis(hypothesisId: string): Promise<{ ok: true } | { ok: false; reason: "failed" | "session" }> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  if (!z.uuid().safeParse(hypothesisId).success) return { ok: false, reason: "failed" }

  const { data, error } = await supabase
    .from("research_hypotheses")
    .delete()
    .eq("id", hypothesisId)
    .select("research_id")
    .maybeSingle()
  if (error) console.error("deleteHypothesis failed", error.code)
  if (error || !data) return { ok: false, reason: "failed" }
  revalidatePath(`/research/${data.research_id}`)
  return { ok: true }
}
