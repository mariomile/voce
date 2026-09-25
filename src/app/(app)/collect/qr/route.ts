import QRCode from "qrcode"
import { getCurrentWorkspace } from "@/lib/data"
import { getOrigin } from "@/lib/origin"

// The public form QR code as a PNG large enough to print. Runs as the signed-in user.
export async function GET() {
  const workspace = await getCurrentWorkspace()
  const url = `${await getOrigin()}/f/${workspace.formSlug}`
  const png = await QRCode.toBuffer(url, { width: 1024, margin: 4, errorCorrectionLevel: "M" })
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="voce-qr-${workspace.formSlug}.png"`,
      "cache-control": "private, no-store",
    },
  })
}
