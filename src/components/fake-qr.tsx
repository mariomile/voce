// Placeholder QR, same as the design. The collection step replaces it with a real one.
export function FakeQr({ seed, size = 92 }: { seed: string; size?: number }) {
  const n = 25
  const s = size / n
  let state = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rnd = () => (state = (state * 9301 + 49297) % 233280) / 233280
  const finder = (x: number, y: number) => {
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      const dx = x - ox
      const dy = y - oy
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7)
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
    }
    return null
  }
  const cells: [number, number][] = []
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y)
      if (f === null ? rnd() > 0.52 : f) cells.push([x, y])
    }
  return (
    <div className="self-start rounded-md bg-paper p-3 leading-none">
      <svg width={size} height={size} role="img" aria-label="QR code del modulo pubblico">
        <g fill="currentColor">
          {cells.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s + 0.2} height={s + 0.2} />
          ))}
        </g>
      </svg>
    </div>
  )
}
