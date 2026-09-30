"use server"

import { getDashboard, getResearch, latestVerdictHypothesisIds, listHypotheses } from "@/lib/data"
import { roomThemes as reduceThemes, roomVerdicts as reduceVerdicts, type RoomTheme, type RoomVerdict } from "@/lib/room"

// The room screen is projected: it gets theme titles, hypotheses, verdict words and counts only. No input;
// reads as the signed-in user, so RLS limits it to their workspace. The live count is in ./status/route.ts.

// The open themes of the Research's latest finished analysis, the same its Sintesi shows first.
// A Research the user cannot read (another workspace's, deleted, a wrong id) has none.
export async function roomThemes(researchId: string): Promise<RoomTheme[]> {
  const research = await getResearch(researchId)
  if (!research) return []
  const { themes } = await getDashboard(research)
  return reduceThemes(themes)
}

// The hypotheses of the Research with the verdict of its last verdict analysis, as the Sintesi shows them,
// without the reasoning and the quotes. A Research the user cannot read has none.
export async function roomVerdicts(researchId: string): Promise<RoomVerdict[]> {
  const research = await getResearch(researchId)
  if (!research) return []
  const [hypotheses, fresh] = await Promise.all([listHypotheses(research), latestVerdictHypothesisIds(research)])
  return reduceVerdicts(hypotheses, fresh)
}
