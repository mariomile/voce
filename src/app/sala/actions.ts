"use server"

import { getCurrentWorkspace, getDashboard, getRoomStatus } from "@/lib/data"
import { roomThemes as reduceThemes, type RoomStatus, type RoomTheme } from "@/lib/room"

// The room screen is projected: these actions answer with counts and theme titles only.
// Both take no input and read as the signed-in user, so RLS limits them to their workspace.

export async function roomStatus(): Promise<RoomStatus> {
  return getRoomStatus(await getCurrentWorkspace())
}

// The open themes of the latest finished analysis, the same the Temi page shows first.
export async function roomThemes(): Promise<RoomTheme[]> {
  const workspace = await getCurrentWorkspace()
  const { themes } = await getDashboard(workspace.id)
  return reduceThemes(themes)
}
