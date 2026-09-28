import type { RoomTheme } from "./room"
import type { ThemeKind } from "./types"

// Geometry of the room screen's dots: one dot per response, piled up while the room writes,
// then sorted into one bubble per theme. Pure functions; src/components/room-dots.tsx draws them.

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; width: number; height: number }

// ---------- Act 1: the pile ----------

// The pile is laid out for a number of places, not for the exact count: within a step a new
// response takes the next place and nothing else moves. Past the last step, steps of 1000.
const PILE_STEPS = [60, 120, 250, 500, 1000, 2000]
// Height lost per pixel away from the middle: how steep the heap is (about 25 degrees).
const PILE_SLOPE = 0.45
const ROW = Math.sqrt(3) / 2

function pileCapacity(width: number, height: number, pitch: number) {
  if (height < pitch || width < pitch) return 0
  const rows = Math.floor((height - pitch) / (pitch * ROW)) + 1
  const even = Math.floor(width / pitch)
  const odd = Math.floor((width - pitch / 2) / pitch)
  return Math.ceil(rows / 2) * even + Math.floor(rows / 2) * odd
}

// A stable pseudo-random number in [0, 1) for a grid place, so the heap looks piled, not printed.
function jitter(row: number, col: number) {
  const n = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453
  return n - Math.floor(n)
}

// Places on a hexagonal grid inside the area, filled from the floor up and from the middle out.
export function pileLayout(area: Rect, count: number): { radius: number; points: Point[] } {
  const places = PILE_STEPS.find((step) => step >= count) ?? Math.ceil(count / 1000) * 1000
  if (area.width <= 0 || area.height <= 0 || count === 0) return { radius: 0, points: [] }

  let pitch = Math.sqrt((area.width * area.height) / (ROW * places))
  while (pitch > 1 && pileCapacity(area.width, area.height, pitch) < places) pitch *= 0.97
  if (pileCapacity(area.width, area.height, pitch) === 0) return { radius: 0, points: [] }

  const floor = area.y + area.height
  const middle = area.x + area.width / 2
  const rows = Math.floor((area.height - pitch) / (pitch * ROW)) + 1
  const slots: (Point & { score: number })[] = []
  for (let row = 0; row < rows; row++) {
    const offset = row % 2 ? pitch / 2 : 0
    const y = floor - pitch / 2 - row * pitch * ROW
    for (let col = 0; ; col++) {
      const x = area.x + pitch / 2 + offset + col * pitch
      if (x + pitch / 2 > area.x + area.width + 0.001) break
      const height = floor - y
      slots.push({ x, y, score: height + PILE_SLOPE * Math.abs(x - middle) + jitter(row, col) * pitch * 0.35 })
    }
  }
  slots.sort((a, b) => a.score - b.score)
  return { radius: pitch * 0.4, points: slots.slice(0, count).map(({ x, y }) => ({ x, y })) }
}

// ---------- Act 2: the bubbles ----------

export type GroupKind = ThemeKind | "other"
export type RoomGroup = { id: string; kind: GroupKind; title: string; count: number }

// The top themes with their exact counts, then the responses left over, if any. The analysis
// reads every feedback of the workspace and a feedback can be in up to 3 themes: the themes can
// add up to more than the responses, and then there is nothing left over.
export function roomGroups(themes: RoomTheme[], responses: number): RoomGroup[] {
  const groups: RoomGroup[] = themes.map((t) => ({ id: t.id, kind: t.kind, title: t.title, count: t.feedbackCount }))
  const rest = responses - themes.reduce((sum, t) => sum + t.feedbackCount, 0)
  if (rest > 0) groups.push({ id: "other", kind: "other", title: "Altro", count: rest })
  return groups
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
// Dot radius as a share of the spiral's spacing: the closest two dots of a spiral are about
// 1.5 spacings apart, so dots never touch.
const BUBBLE_DOT = 0.6

// A sunflower spiral: n points evenly spread in a disc of radius spacing * sqrt(n).
export function sunflower(n: number, spacing: number, center: Point): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const r = spacing * Math.sqrt(i + 0.5)
    const a = i * GOLDEN_ANGLE
    return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) }
  })
}

export type Bubble = { cx: number; cy: number; radius: number; column: { x: number; width: number }; points: Point[] }

// One bubble per group, in a row, resting on the floor of the area. Every dot has the same size
// in every bubble, so a bubble's area follows its count. Each bubble sits in a column at least
// minWidth wide, for its label underneath; the row is centered.
export function bubbleLayout(
  area: Rect,
  groups: { count: number; minWidth: number }[],
  gap: number
): { dotRadius: number; bubbles: Bubble[] } {
  if (area.width <= 0 || area.height <= 0)
    return {
      dotRadius: 0,
      bubbles: groups.map(() => ({ cx: area.x, cy: area.y, radius: 0, column: { x: area.x, width: 0 }, points: [] })),
    }

  const gaps = gap * Math.max(0, groups.length - 1)
  const minTotal = groups.reduce((sum, g) => sum + g.minWidth, 0)
  const shrink = minTotal > 0 ? Math.max(0, Math.min(1, (area.width - gaps) / minTotal)) : 1
  const minWidths = groups.map((g) => g.minWidth * shrink)
  const radiusOf = (count: number, spacing: number) => spacing * (Math.sqrt(count) + BUBBLE_DOT)
  const widthsFor = (spacing: number) => groups.map((g, i) => Math.max(2 * radiusOf(g.count, spacing), minWidths[i]))
  const fits = (spacing: number) =>
    widthsFor(spacing).reduce((a, b) => a + b, 0) + gaps <= area.width &&
    groups.every((g) => 2 * radiusOf(g.count, spacing) <= area.height)

  let low = 0
  let high = area.height
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    if (fits(mid)) low = mid
    else high = mid
  }
  const spacing = low
  const widths = widthsFor(spacing)
  const total = widths.reduce((a, b) => a + b, 0) + gaps
  const floor = area.y + area.height
  let cursor = area.x + (area.width - total) / 2
  const bubbles = groups.map((g, i) => {
    const radius = radiusOf(g.count, spacing)
    const cx = cursor + widths[i] / 2
    const cy = floor - radius
    const bubble = { cx, cy, radius, column: { x: cursor, width: widths[i] }, points: sunflower(g.count, spacing, { x: cx, y: cy }) }
    cursor += widths[i] + gap
    return bubble
  })
  return { dotRadius: spacing * BUBBLE_DOT, bubbles }
}

// ---------- From the pile to the bubbles ----------

// Dot indexes from left to right: the order in which they fill the bubbles.
export function dotOrderByX(points: Point[]): number[] {
  return points
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map((p) => p.i)
}

// Where each dot goes. order lists the pile's dots (indexes 0 to n - 1) from left to right: the
// first fill the first bubble, and so on. Places left once the pile is used up (the themes need
// more dots, or responses arrived after the analysis) go to the next indexes, in bubble order.
// The bubbles must have at least as many places as order has dots.
export function bubbleTargets(order: number[], bubbles: { points: Point[] }[]): (Point & { group: number })[] {
  const places = bubbles.flatMap((b, group) => b.points.map((p) => ({ x: p.x, y: p.y, group })))
  const targets: (Point & { group: number })[] = new Array(places.length)
  places.forEach((place, j) => {
    targets[j < order.length ? order[j] : j] = place
  })
  return targets
}

// ---------- Timing ----------

// Delay of each dot, one after the other: step apart, squeezed so the last starts by max.
export function staggerDelays(n: number, step: number, max: number): number[] {
  const interval = n > 1 ? Math.min(step, max / (n - 1)) : 0
  return Array.from({ length: n }, (_, i) => i * interval)
}
