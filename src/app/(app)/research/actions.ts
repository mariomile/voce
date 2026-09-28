"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data"
import { RESEARCH_QUESTION_MAX_LENGTH } from "@/lib/plans"
import { createClient } from "@/lib/supabase/server"

export type CreateResearchResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid" | "too_long" | "failed" | "session" }

// The workspace comes from the session; the database function checks the membership and the question
// again, and picks the form link. On success the browser goes to /research/{id}.
export async function createResearch(question: string): Promise<CreateResearchResult> {
  const parsed = z.string().safeParse(question)
  // Postgres text cannot hold NUL characters.
  const clean = parsed.success ? parsed.data.replaceAll("\0", "").trim() : ""
  if (!clean) return { ok: false, reason: "invalid" }
  // Counted like char_length in the database: characters, not UTF-16 units.
  if ([...clean].length > RESEARCH_QUESTION_MAX_LENGTH) return { ok: false, reason: "too_long" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const workspace = await getCurrentWorkspace()
  const { data: id, error } = await supabase.rpc("create_research", { ws: workspace.id, question: clean })
  if (error) {
    console.error("create_research failed", error.code)
    return { ok: false, reason: "failed" }
  }
  revalidatePath("/research")
  return { ok: true, id }
}
