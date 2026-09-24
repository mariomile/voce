"use server"

import { z } from "zod"
import { getCurrentWorkspace, getPublicForm, getTheme } from "@/lib/data"
import { FEEDBACK_MAX_LENGTH } from "@/lib/plans"

// Server actions validate every input with an explicit schema.
// Nothing is saved yet: the Supabase step adds the writes where marked.

const themeUpdateSchema = z.object({
  themeId: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).nullable(),
  status: z.enum(["to_review", "roadmap", "done", "discarded"]),
})

export async function updateTheme(input: z.input<typeof themeUpdateSchema>) {
  const parsed = themeUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const }
  const workspace = await getCurrentWorkspace()
  if (!(await getTheme(workspace.id, parsed.data.themeId))) return { ok: false as const }
  // Supabase step: update the theme's priority and status.
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
  const form = await getPublicForm(parsed.data.slug)
  if (!form) return { ok: false, reason: "unavailable" }
  if (!form.accepting) return { ok: false, reason: "unavailable" }
  // Supabase step: rate limits (10/min per IP, 300/h per workspace) and the insert,
  // with channel "Modulo pubblico".
  return { ok: true }
}
