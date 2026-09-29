"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { trackFormMilestones } from "@/lib/analytics"
import { getCurrentWorkspace } from "@/lib/data"
import { FEEDBACK_MAX_LENGTH, FORM_SLUG_PATTERN } from "@/lib/plans"
import { sendPublicFeedback } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Server actions validate every input with an explicit schema, then write as the signed-in user:
// RLS and column grants decide what the write can touch.

const themeUpdateSchema = z.object({
  themeId: z.uuid(),
  priority: z.enum(["high", "medium", "low"]).nullable(),
  status: z.enum(["to_review", "roadmap", "done", "discarded"]),
})

export async function updateTheme(input: z.input<typeof themeUpdateSchema>) {
  const parsed = themeUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("themes")
    .update({ priority: parsed.data.priority, status: parsed.data.status })
    .eq("workspace_id", workspace.id)
    .eq("id", parsed.data.themeId)
    .select("id")
  if (error || data.length === 0) return { ok: false as const }
  return { ok: true as const }
}

const feedbackSubmissionSchema = z.object({
  slug: z.string().regex(FORM_SLUG_PATTERN),
  // Postgres text cannot hold NUL characters.
  text: z.string().transform((t) => t.replaceAll("\0", "")).pipe(z.string().trim().min(1).max(FEEDBACK_MAX_LENGTH)),
  email: z.union([z.literal(""), z.email().max(254)]),
  // Hidden anti-bot field: people leave it empty.
  website: z.string().max(0),
})

export type SubmitFeedbackResult =
  | { ok: true }
  | { ok: false; reason: "invalid_email" | "invalid" | "unavailable" | "rate_limited" }

export async function submitFeedback(
  input: z.input<typeof feedbackSubmissionSchema>
): Promise<SubmitFeedbackResult> {
  const parsed = feedbackSubmissionSchema.safeParse(input)
  // A filled honeypot gets a fake success, so bots learn nothing.
  if (!parsed.success && parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true }
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.some((i) => i.path[0] === "email")
    return { ok: false, reason: emailIssue ? "invalid_email" : "invalid" }
  }
  // The database function checks the link, the rate limits and the Free limit, and fixes the channel.
  // Vercel sets these headers itself, so the visitor cannot choose their IP.
  const requestHeaders = await headers()
  const clientIp =
    requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const result = await sendPublicFeedback({ ...parsed.data, clientIp })
  if (result !== "ok") return { ok: false, reason: result }
  trackFormMilestones(parsed.data.slug)
  return { ok: true }
}
