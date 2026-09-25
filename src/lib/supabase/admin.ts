import "server-only"

import { createHmac } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/lib/database.types"
import type { CheckedTheme } from "@/lib/analysis"

// The secret key bypasses RLS, so it does only what the server alone may do: send a public form
// submission with the visitor IP it sees, and reserve, save or fail an AI analysis. If users could
// call those, they could skip the rate limits or write fake themes and costs.

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
