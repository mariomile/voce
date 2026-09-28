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
} from "@/lib/analysis"
import { trackEvent, trackMilestone } from "@/lib/analytics"
import { getResearch } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { HYPOTHESIS_MAX_LENGTH } from "@/lib/plans"
import { failAnalysis, finishAnalysis, finishVerdict, startAnalysis } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { buildVerdictPrompt, runVerdict, verdictInstructions, type VerdictFeedback, type VerdictHypothesis } from "@/lib/verdict"
import type { Locale } from "@/i18n/locale"

export type VerdictCounts = { confirmed: number; refuted: number; toReview: number }

const NO_VERDICTS: VerdictCounts = { confirmed: 0, refuted: 0, toReview: 0 }

export type SynthesizeResult =
  | {
      ok: true
      // Each part counts in the quota only when done. previousThemesDate: the day of the themes still shown
      // when this run's themes did not come (S5).
      themes: "done" | "failed" | "no_themes"
      themeCount: number
      verdict: "done" | "failed" | "skipped"
      // The verdicts saved by this run, per word: what the end of the analysis announces.
      verdicts: VerdictCounts
      previousThemesDate: string | null
    }
  | { ok: false; reason: "no_feedback" | "busy" | "limit" | "no_themes" | "failed" | "session" | "not_found" }

// One click on "Analizza": the themes of this Research and, when it has hypotheses, their verdict, two model
// calls that run together. Reads run as the signed-in user, so RLS limits them to their workspace: a
// Research of another workspace is not found, and nothing is sent to the model. The database reserves both
// analyses (quota, one at a time per workspace) before the model is called, and locks the hypotheses until
// they are closed; the themes and verdicts of before stay until the new ones are saved in full. Used by the
// Sintesi and by the room screen.
export async function synthesize(researchId: string): Promise<SynthesizeResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const research = await getResearch(researchId)
  if (!research) return { ok: false, reason: "not_found" }
  // Titles, summaries and reasoning are written in the language the PM is using right now.
  const locale = await getLocale()

  const [feedbackRows, latest, hypothesisRows] = await Promise.all([
    supabase
      .from("feedback")
      .select("id, text, channel, received_at, created_at")
      .eq("workspace_id", research.workspaceId)
      .eq("research_id", research.id)
      .order("received_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ANALYSIS_MAX_FEEDBACK),
    supabase
      .from("analyses")
      .select("id, created_at")
      .eq("research_id", research.id)
      .eq("kind", "themes")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("research_hypotheses").select("id, text, written_at").eq("research_id", research.id).order("position"),
  ])
  if (feedbackRows.error) throw feedbackRows.error
  if (latest.error) throw latest.error
  if (hypothesisRows.error) throw hypothesisRows.error

  const feedback: VerdictFeedback[] = selectFeedback(feedbackRows.data).map((f) => ({
    id: f.id,
    text: f.text,
    channel: f.channel,
    receivedAt: f.received_at,
    createdAt: f.created_at,
  }))
  if (feedback.length === 0) return { ok: false, reason: "no_feedback" }
  const hypotheses: VerdictHypothesis[] = hypothesisRows.data.map((h) => ({ id: h.id, text: h.text, writtenAt: h.written_at }))

  let existingTitles: string[] = []
  if (latest.data) {
    const themes = await supabase.from("themes").select("title").eq("analysis_id", latest.data.id)
    if (themes.error) throw themes.error
    existingTitles = themes.data.map((t) => t.title)
  }

  const modelId = analysisModel()
  const today = isoDateOf(new Date())
  const feedbackIds = feedback.map((f) => f.id)
  const start = await startAnalysis({
    workspaceId: research.workspaceId,
    researchId: research.id,
    model: modelId,
    // The verdict joins the themes when the Research has hypotheses.
    kinds: hypotheses.length > 0 ? ["themes", "verdict"] : ["themes"],
    periodStart: feedback.reduce((min, f) => (f.receivedAt < min ? f.receivedAt : min), today),
    feedbackCount: feedback.length,
    inputs: {
      themes: {
        instructions: analysisInstructions(locale),
        prompt: buildPrompt(feedback, existingTitles),
        feedback_ids: feedbackIds,
      },
      ...(hypotheses.length > 0 && {
        verdict: {
          instructions: verdictInstructions(locale),
          prompt: buildVerdictPrompt(hypotheses, feedback),
          feedback_ids: feedbackIds,
          hypothesis_ids: hypotheses.map((h) => h.id),
        },
      }),
    },
  })
  if (start.outcome !== "ok") return { ok: false, reason: start.outcome }

  const [themes, verdict] = await Promise.all([
    themesPart(start.analyses.themes!, { modelId, feedback, existingTitles, locale }),
    start.analyses.verdict
      ? verdictPart(start.analyses.verdict, { modelId, feedback, hypotheses, locale, supabase })
      : ({ outcome: "skipped" } as const),
  ])
  if (themes.outcome !== "done" && verdict.outcome !== "done") {
    return { ok: false, reason: themes.outcome === "no_themes" ? "no_themes" : "failed" }
  }

  const themeCount = themes.outcome === "done" ? themes.themeCount : 0
  const verdictCount = verdict.outcome === "done" ? verdict.verdictCount : 0
  const verdicts = verdict.outcome === "done" ? verdict.verdicts : NO_VERDICTS
  if (themes.outcome === "done") {
    trackMilestone(research.workspaceId, {
      event: "first_analysis_completed",
      properties: { feedback_count: feedback.length, theme_count: themeCount },
    })
  }
  trackEvent(research.workspaceId, {
    event: "research_synthesized",
    properties: {
      feedback_count: feedback.length,
      citation_count: (themes.outcome === "done" ? themes.citations : 0) + (verdict.outcome === "done" ? verdict.citations : 0),
      hypothesis_count: verdictCount,
    },
  })
  revalidatePath("/", "layout")
  return {
    ok: true,
    themes: themes.outcome,
    themeCount,
    verdict: verdict.outcome,
    verdicts,
    previousThemesDate: latest.data ? isoDateOf(new Date(latest.data.created_at)) : null,
  }
}

type PartInput = { modelId: string; feedback: VerdictFeedback[]; locale: Locale }

// The themes call. No theme left: the previous analysis stays, with the priorities and statuses the PM gave it.
async function themesPart(
  analysisId: string,
  { modelId, feedback, locale, existingTitles }: PartInput & { existingTitles: string[] }
): Promise<{ outcome: "done"; themeCount: number; citations: number } | { outcome: "failed" | "no_themes" }> {
  const started = performance.now()
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
    if (result.themes.length === 0) {
      await failAnalysis(analysisId, "no_themes", run)
      return { outcome: "no_themes" }
    }
    const citations = await finishAnalysis(analysisId, result.themes, run)
    return { outcome: "done", themeCount: result.themes.length, citations }
  } catch (error) {
    await failPart(analysisId, error, modelId, started)
    return { outcome: "failed" }
  }
}

// The verdict call: every hypothesis of the Research at once. A hypothesis the model leaves out keeps its
// previous verdict.
async function verdictPart(
  analysisId: string,
  {
    modelId,
    feedback,
    locale,
    hypotheses,
    supabase,
  }: PartInput & { hypotheses: VerdictHypothesis[]; supabase: Awaited<ReturnType<typeof createClient>> }
): Promise<{ outcome: "done"; verdictCount: number; verdicts: VerdictCounts; citations: number } | { outcome: "failed" }> {
  const started = performance.now()
  let saved: { quotes: number; verdicts: number }
  try {
    const result = await runVerdict({ model: analysisLanguageModel(), modelId, hypotheses, feedback, locale })
    saved = await finishVerdict(analysisId, result.verdicts, {
      output: result.raw,
      issues: result.issues,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      duration_ms: result.durationMs,
      cost_usd: result.costUsd,
    })
  } catch (error) {
    await failPart(analysisId, error, modelId, started)
    return { outcome: "failed" }
  }
  // Read back once saved: the database may have turned a verdict left without quotes of its side into to_review.
  const { data, error } = await supabase.from("hypothesis_verdicts").select("verdict").eq("analysis_id", analysisId)
  if (error) throw error
  const count = (word: string) => data.filter((v) => v.verdict === word).length
  const verdicts = { confirmed: count("confirmed"), refuted: count("refuted"), toReview: count("to_review") }
  return { outcome: "done", verdictCount: saved.verdicts, verdicts, citations: saved.quotes }
}

async function failPart(analysisId: string, error: unknown, modelId: string, started: number) {
  // Only the error name reaches the logs: messages can carry feedback and hypothesis text.
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
}

function errorMessage(error: unknown) {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return text.slice(0, 2000)
}

export type HypothesisResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "too_long" | "max_reached" | "busy" | "failed" | "session" }

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
    if (error.message === "analysis_running") return { ok: false, reason: "busy" }
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
  if (error?.message === "analysis_running") return { ok: false, reason: "busy" }
  if (error) console.error("updateHypothesis failed", error.code)
  if (error || !data) return { ok: false, reason: "failed" }
  revalidatePath(`/research/${data.research_id}`)
  return { ok: true }
}

// During an analysis of the Research the database refuses every change to its hypotheses: busy (H7).
export async function deleteHypothesis(
  hypothesisId: string
): Promise<{ ok: true } | { ok: false; reason: "busy" | "failed" | "session" }> {
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
  if (error?.message === "analysis_running") return { ok: false, reason: "busy" }
  if (error) console.error("deleteHypothesis failed", error.code)
  if (error || !data) return { ok: false, reason: "failed" }
  revalidatePath(`/research/${data.research_id}`)
  return { ok: true }
}
