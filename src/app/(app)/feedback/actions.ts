"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentWorkspace } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

// Runs as the signed-in user: RLS lets the delete touch only feedback of their workspace.
// The theme links go with the feedback, so themes and quotes change without a new analysis.
// A feedback already gone (deleted in another tab) is a success: the list refreshes without it.
export async function deleteFeedback(feedbackId: string) {
  const parsed = z.uuid().safeParse(feedbackId)
  if (!parsed.success) return { ok: false as const }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { error } = await supabase.from("feedback").delete().eq("workspace_id", workspace.id).eq("id", parsed.data)
  if (error) {
    // Only the error code reaches the logs, never feedback text.
    console.error(`Feedback delete failed: ${error.code}`)
    return { ok: false as const }
  }
  revalidatePath("/", "layout")
  return { ok: true as const }
}
