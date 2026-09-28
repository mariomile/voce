import QRCode from "qrcode"
import { getResearch } from "@/lib/data"
import { getOrigin } from "@/lib/origin"

// The public form QR code of a Research as a PNG large enough to print. Runs as the signed-in user:
// a Research they cannot read is a 404.
export async function GET(_: Request, { params }: RouteContext<"/research/[id]/qr">) {
  const research = await getResearch((await params).id)
  if (!research) return new Response(null, { status: 404 })
  const url = `${await getOrigin()}/f/${research.formSlug}`
  const png = await QRCode.toBuffer(url, { width: 1024, margin: 4, errorCorrectionLevel: "M" })
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="voce-qr-${research.formSlug}.png"`,
      "cache-control": "private, no-store",
    },
  })
}
