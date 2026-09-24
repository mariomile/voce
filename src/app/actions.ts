"use server"

import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data"
import { FEEDBACK_MAX_LENGTH } from "@/lib/plans"
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
  slug: z.string().min(1).max(100),
  text: z.string().trim().min(1).max(FEEDBACK_MAX_LENGTH),
  email: z.union([z.literal(""), z.email().max(254)]),
  // Hidden anti-bot field: people leave it empty.
  website: z.string().max(0),
})

export type SubmitFeedbackResult =
  | { ok: true }
  | { ok: false; reason: "invalid_email" | "invalid" | "unavailable" }

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
  // The database function checks the link, the Free limit and fixes the channel.
  // Rate limits (10/min per IP, 300/h per workspace) are not built yet.
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("submit_public_feedback", {
    slug: parsed.data.slug,
    feedback_text: parsed.data.text,
    email: parsed.data.email,
  })
  if (error) throw error
  if (data === "ok") return { ok: true }
  return { ok: false, reason: data === "invalid" ? "invalid" : "unavailable" }
}
