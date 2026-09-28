import type { Metadata } from "next"
import { QrCode } from "@/components/qr-code"
import { RoomScreen } from "@/components/room-screen"
import { getCurrentWorkspace, getRoomStatus, getUsage } from "@/lib/data"
import { analysisLimitNote } from "@/lib/format"
import { getOrigin } from "@/lib/origin"
import "../landing.css"

export const metadata: Metadata = { title: "Schermo della sala" }

// The analysis action runs from this page and can take a few minutes.
export const maxDuration = 300

// Projected during a live session: the question, the QR code and the live count, then the themes.
// Never the text of a feedback: the screen gets counts and theme titles only.
export default async function RoomPage() {
  const workspace = await getCurrentWorkspace()
  const [status, usage, origin] = await Promise.all([
    getRoomStatus(workspace),
    getUsage(workspace.id),
    getOrigin(),
  ])
  const formPath = `/f/${workspace.formSlug}`
  return (
    <RoomScreen
      workspaceName={workspace.name}
      // Same default as get_public_form in the database.
      question={workspace.formQuestion ?? `Cosa vuoi dire al team di ${workspace.name}?`}
      shortUrl={`${new URL(origin).host}${formPath}`}
      qrCode={<QrCode url={`${origin}${formPath}`} className="room-qr rounded-lg p-[max(12px,1.6svh)]" />}
      initialStatus={status}
      limitNote={analysisLimitNote(usage)}
    />
  )
}
