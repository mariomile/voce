import { getCurrentWorkspace, getRoomStatus } from "@/lib/data"

// The live count of the room screen, polled every few seconds: number of public form responses and
// the state of the form, never feedback text. A route handler and not a server action: actions
// from one page run one at a time, and the counter would stop for the whole analysis.
// No input; reads as the signed-in user, so RLS limits it to their workspace.
export async function GET() {
  const status = await getRoomStatus(await getCurrentWorkspace())
  return Response.json(status, { headers: { "cache-control": "private, no-store" } })
}
