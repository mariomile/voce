import { getResearch, getRoomStatus } from "@/lib/data"

// The live count of the room screen, polled every few seconds: number of responses to the Research's
// public form and the state of the form, never feedback text. A route handler and not a server action:
// actions from one page run one at a time, and the counter would stop for the whole analysis.
// Reads as the signed-in user, so RLS limits it to their workspace: another Research is a 404.
export async function GET(_: Request, { params }: RouteContext<"/research/[id]/sala/status">) {
  const research = await getResearch((await params).id)
  if (!research) return new Response(null, { status: 404, headers: { "cache-control": "private, no-store" } })
  return Response.json(await getRoomStatus(research), { headers: { "cache-control": "private, no-store" } })
}
