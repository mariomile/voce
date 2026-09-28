"use server"

import { getCurrentWorkspace, getDashboard } from "@/lib/data"
import { roomThemes as reduceThemes, type RoomTheme } from "@/lib/room"

// The room screen is projected: it gets theme titles and counts only. No input; reads as the
// signed-in user, so RLS limits it to their workspace. The live count is in ./status/route.ts.

// The open themes of the latest finished analysis, the same the Temi page shows first.
export async function roomThemes(): Promise<RoomTheme[]> {
  const workspace = await getCurrentWorkspace()
  const { themes } = await getDashboard(workspace.id)
  return reduceThemes(themes)
}
