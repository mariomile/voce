"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

// Runs as the signed-in user: RLS lets the delete touch only feedback of their workspace.
// The theme links go with the feedback, so themes and quotes change without a new analysis.
export async function deleteFeedback(feedbackId: string) {
  const parsed = z.uuid().safeParse(feedbackId)
  if (!parsed.success) return { ok: false as const }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("feedback")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", parsed.data)
    .select("id")
  if (error || data.length === 0) return { ok: false as const }
  revalidatePath("/", "layout")
  return { ok: true as const }
}
