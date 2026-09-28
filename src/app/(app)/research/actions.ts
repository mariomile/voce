"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data"
import { RESEARCH_QUESTION_MAX_LENGTH } from "@/lib/plans"
import { createClient } from "@/lib/supabase/server"

export type CreateResearchResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "too_long" | "failed" | "session" }

export type UpdateResearchQuestionResult = { ok: true } | { ok: false; reason: "invalid" | "too_long" | "failed" | "session" }

// The question as the database will keep it, or why not.
function cleanQuestion(question: unknown): { ok: true; text: string } | { ok: false; reason: "invalid" | "too_long" } {
  const parsed = z.string().safeParse(question)
  // Postgres text cannot hold NUL characters.
  const clean = parsed.success ? parsed.data.replaceAll("\0", "").trim() : ""
  if (!clean) return { ok: false, reason: "invalid" }
  // Counted like char_length in the database: characters, not UTF-16 units.
  if ([...clean].length > RESEARCH_QUESTION_MAX_LENGTH) return { ok: false, reason: "too_long" }
  return { ok: true, text: clean }
}

// The workspace comes from the session; the database function checks the membership and the question
// again, and picks the form link. On success the browser goes to /research/{id}.
export async function createResearch(question: string): Promise<CreateResearchResult> {
  const clean = cleanQuestion(question)
  if (!clean.ok) return clean

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const workspace = await getCurrentWorkspace()
  const { data: id, error } = await supabase.rpc("create_research", { ws: workspace.id, question: clean.text })
  if (error) {
    console.error("create_research failed", error.code)
    return { ok: false, reason: "failed" }
  }
  revalidatePath("/research")
  return { ok: true, id }
}

// Only the question changes: it is the name of the Research and never reaches the model, so themes,
// hypotheses and verdicts stay as they are. Runs as the signed-in user: RLS keeps it to their workspace,
// and another workspace's Research updates no row.
export async function updateResearchQuestion(researchId: string, question: string): Promise<UpdateResearchQuestionResult> {
  const clean = cleanQuestion(question)
  if (!clean.ok) return clean
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  if (!z.uuid().safeParse(researchId).success) return { ok: false, reason: "failed" }

  const { data, error } = await supabase
    .from("research")
    .update({ question: clean.text })
    .eq("id", researchId)
    .select("id")
    .maybeSingle()
  if (error) console.error("updateResearchQuestion failed", error.code)
  if (error || !data) return { ok: false, reason: "failed" }
  revalidatePath(`/research/${researchId}`, "layout")
  return { ok: true }
}

// Deletes the Research: the database takes its feedback, themes, hypotheses and verdicts with it, keeps its
// analyses and questions for the month's quota and empties their logs. Runs as the signed-in user, like the
// update. On success the browser goes to /research, which says "Research eliminata.".
export async function deleteResearch(researchId: string): Promise<{ ok: false; reason: "failed" | "session" }> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  if (!z.uuid().safeParse(researchId).success) return { ok: false, reason: "failed" }

  const { data, error } = await supabase.from("research").delete().eq("id", researchId).select("id").maybeSingle()
  if (error) console.error("deleteResearch failed", error.code)
  if (error || !data) return { ok: false, reason: "failed" }
  revalidatePath("/", "layout")
  redirect("/research")
}
