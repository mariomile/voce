import { cn } from "cn"
import { useTranslations } from "next-intl"
import QRCode from "qrcode"

// Kit: .qr-code. Drawn as one SVG path from the QR modules; the white padding is the quiet zone.
export function QrCode({ url, size = 92, className }: { url: string; size?: number; className?: string }) {
  const t = useTranslations("themes.qrCode")
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" })
  const n = modules.size
  let path = ""
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (modules.data[y * n + x]) path += `M${x} ${y}h1v1h-1z`
  return (
    <div className={cn("self-start rounded-md bg-paper p-3 leading-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={t("alt")}
      >
        <path d={path} fill="currentColor" />
      </svg>
    </div>
  )
}
