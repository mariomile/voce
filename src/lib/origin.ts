import "server-only"

import { headers } from "next/headers"

// The address the PM sees in the browser: the public link and its QR code point there.
export async function getOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "https"
  return `${proto}://${host}`
}
