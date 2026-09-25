import QRCode from "qrcode"

// Kit: .qr-code. Drawn as one SVG path from the QR modules; the white padding is the quiet zone.
export function QrCode({ url, size = 92 }: { url: string; size?: number }) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" })
  const n = modules.size
  let path = ""
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (modules.data[y * n + x]) path += `M${x} ${y}h1v1h-1z`
  return (
    <div className="self-start rounded-md bg-paper p-3 leading-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label="QR code del modulo pubblico"
      >
        <path d={path} fill="currentColor" />
      </svg>
    </div>
  )
}
