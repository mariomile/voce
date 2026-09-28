import { redirect } from "next/navigation"
import { getCurrentWorkspace, getLatestResearchId } from "@/lib/data"

// The old address of the room screen: opens the room of the Research created last, or the list when
// there is none. Signed-out users never get here: the proxy sends them to /login.
export async function GET() {
  const workspace = await getCurrentWorkspace()
  const id = await getLatestResearchId(workspace.id)
  redirect(id ? `/research/${id}/sala` : "/research")
}
