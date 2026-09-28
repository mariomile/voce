"use server"

import { getDashboard, getResearch } from "@/lib/data"
import { roomThemes as reduceThemes, type RoomTheme } from "@/lib/room"

// The room screen is projected: it gets theme titles and counts only. No input; reads as the
// signed-in user, so RLS limits it to their workspace. The live count is in ./status/route.ts.

// The open themes of the Research's latest finished analysis, the same its Sintesi shows first.
// A Research the user cannot read (another workspace's, deleted, a wrong id) has none.
export async function roomThemes(researchId: string): Promise<RoomTheme[]> {
  const research = await getResearch(researchId)
  if (!research) return []
  const { themes } = await getDashboard(research)
  return reduceThemes(themes)
}
