import { describe, expect, it } from "vitest"
import {
  bubbleLayout,
  bubbleTargets,
  dotOrderByX,
  pileLayout,
  roomGroups,
  staggerDelays,
  sunflower,
  type Point,
} from "./room-viz"
import type { RoomTheme } from "./room"

function minDistance(points: Point[]) {
  let min = Infinity
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      min = Math.min(min, Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y))
  return min
}

const theme = (id: string, feedbackCount: number, kind: RoomTheme["kind"] = "problem"): RoomTheme => ({
  id,
  kind,
  title: `Tema ${id}`,
  feedbackCount,
})

describe("pileLayout", () => {
  const area = { x: 100, y: 200, width: 900, height: 300 }

  it("gives one point per response, all inside the area, none overlapping", () => {
    for (const count of [0, 1, 12, 230, 500, 1300]) {
      const { points, radius } = pileLayout(area, count)
      expect(points).toHaveLength(count)
      for (const p of points) {
        expect(p.x - radius).toBeGreaterThanOrEqual(area.x - 0.001)
        expect(p.x + radius).toBeLessThanOrEqual(area.x + area.width + 0.001)
        expect(p.y - radius).toBeGreaterThanOrEqual(area.y - 0.001)
        expect(p.y + radius).toBeLessThanOrEqual(area.y + area.height + 0.001)
      }
      if (count > 1) expect(minDistance(points)).toBeGreaterThanOrEqual(2 * radius)
    }
  })

  it("keeps the same dot size within a step, so a new response does not move the others", () => {
    const a = pileLayout(area, 40)
    const b = pileLayout(area, 41)
    expect(b.radius).toBe(a.radius)
    expect(b.points.slice(0, 40)).toEqual(a.points)
  })

  it("makes the dots smaller as the room fills up", () => {
    expect(pileLayout(area, 300).radius).toBeLessThan(pileLayout(area, 12).radius)
  })

  it("heaps up in the middle first and rests on the floor", () => {
    const { points, radius } = pileLayout(area, 12)
    const floor = area.y + area.height
    const centerX = area.x + area.width / 2
    const lowest = Math.max(...points.map((p) => p.y))
    expect(lowest + radius).toBeGreaterThan(floor - radius)
    for (const p of points) expect(Math.abs(p.x - centerX)).toBeLessThan(area.width / 3)
  })

  it("is empty for an area with no room", () => {
    expect(pileLayout({ x: 0, y: 0, width: 0, height: 0 }, 10).points).toHaveLength(0)
  })
})

describe("roomGroups", () => {
  it("adds the other responses as a last group when the themes do not cover them all", () => {
    const groups = roomGroups([theme("a", 60), theme("b", 40)], 130)
    expect(groups.map((g) => [g.id, g.count])).toEqual([
      ["a", 60],
      ["b", 40],
      ["other", 30],
    ])
    expect(groups[2].kind).toBe("other")
  })

  it("never has a negative remainder: a feedback can be in more themes, and themes read all feedback", () => {
    const groups = roomGroups([theme("a", 60), theme("b", 50)], 80)
    expect(groups.map((g) => g.count)).toEqual([60, 50])
  })

  it("keeps each theme's count exactly", () => {
    const themes = [theme("a", 7), theme("b", 5, "praise"), theme("c", 2, "opportunity")]
    const groups = roomGroups(themes, 14)
    expect(groups.slice(0, 3).map((g) => [g.kind, g.title, g.count])).toEqual(
      themes.map((t) => [t.kind, t.title, t.feedbackCount])
    )
  })
})

describe("sunflower", () => {
  it("places n points around the center, closer than the given radius, without overlapping dots", () => {
    const spacing = 10
    const points = sunflower(80, spacing, { x: 0, y: 0 })
    expect(points).toHaveLength(80)
    for (const p of points) expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(spacing * Math.sqrt(80))
    expect(minDistance(points)).toBeGreaterThan(spacing * 1.2)
  })
})

describe("bubbleLayout", () => {
  const area = { x: 0, y: 100, width: 1600, height: 500 }
  const groups = [60, 45, 30, 20, 12, 63].map((count) => ({ count, minWidth: 220 }))

  it("gives each bubble exactly as many dots as its group", () => {
    const { bubbles } = bubbleLayout(area, groups, 24)
    expect(bubbles.map((b) => b.points.length)).toEqual([60, 45, 30, 20, 12, 63])
  })

  it("makes the area of each bubble follow its count: every dot has the same size", () => {
    const { bubbles } = bubbleLayout(area, groups, 24)
    const ratio = (bubbles[0].radius / bubbles[4].radius) ** 2
    expect(ratio).toBeGreaterThan(3)
    expect(ratio).toBeLessThan(60 / 12)
  })

  it("fits the area, rests the bubbles on the same floor and never overlaps columns", () => {
    for (const size of [area, { x: 20, y: 60, width: 800, height: 200 }]) {
      const { bubbles, dotRadius } = bubbleLayout(size, groups, 24)
      const floor = size.y + size.height
      for (const b of bubbles) {
        expect(b.cx - b.radius).toBeGreaterThanOrEqual(size.x - 0.001)
        expect(b.cx + b.radius).toBeLessThanOrEqual(size.x + size.width + 0.001)
        expect(b.cy - b.radius).toBeGreaterThanOrEqual(size.y - 0.001)
        expect(b.cy + b.radius).toBeCloseTo(floor, 3)
        expect(b.column.x).toBeGreaterThanOrEqual(size.x - 0.001)
        expect(b.column.x + b.column.width).toBeLessThanOrEqual(size.x + size.width + 0.001)
        for (const p of b.points) expect(Math.hypot(p.x - b.cx, p.y - b.cy) + dotRadius).toBeLessThanOrEqual(b.radius + 0.001)
      }
      for (let i = 1; i < bubbles.length; i++) {
        const prev = bubbles[i - 1].column
        expect(bubbles[i].column.x).toBeGreaterThanOrEqual(prev.x + prev.width)
      }
      expect(minDistance(bubbles.flatMap((b) => b.points))).toBeGreaterThanOrEqual(2 * dotRadius)
    }
  })

  it("is empty for an area with no room", () => {
    expect(bubbleLayout({ x: 0, y: 0, width: 0, height: 0 }, groups, 24).bubbles.every((b) => b.points.length === 0)).toBe(true)
  })
})

describe("dotOrderByX and bubbleTargets", () => {
  it("sends the leftmost dots of the pile to the first bubble", () => {
    const pile = [
      { x: 50, y: 0 },
      { x: 10, y: 0 },
      { x: 30, y: 0 },
    ]
    const order = dotOrderByX(pile)
    expect(order).toEqual([1, 2, 0])
    const bubbles = [
      { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] },
      { points: [{ x: 9, y: 9 }] },
    ]
    const targets = bubbleTargets(order, bubbles)
    expect(targets[1]).toEqual({ x: 1, y: 1, group: 0 })
    expect(targets[2]).toEqual({ x: 2, y: 2, group: 0 })
    expect(targets[0]).toEqual({ x: 9, y: 9, group: 1 })
  })

  it("adds the dots the bubbles need beyond the pile, and places the responses that came later last", () => {
    const bubbles = [{ points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }, { points: [{ x: 3, y: 3 }, { x: 4, y: 4 }] }]
    const targets = bubbleTargets([1, 0], bubbles)
    expect(targets).toHaveLength(4)
    expect(targets.map((t) => t.group)).toEqual([0, 0, 1, 1])
    expect(targets[2]).toEqual({ x: 3, y: 3, group: 1 })
    expect(targets[3]).toEqual({ x: 4, y: 4, group: 1 })
  })

  it("gives every bubble as many dots as it has points", () => {
    const counts = [7, 4, 3]
    const bubbles = counts.map((n, g) => ({ points: Array.from({ length: n }, (_, i) => ({ x: g * 100 + i, y: 0 })) }))
    const order = Array.from({ length: 10 }, (_, i) => 9 - i)
    const targets = bubbleTargets(order, bubbles)
    expect(counts.map((_, g) => targets.filter((t) => t.group === g).length)).toEqual(counts)
  })
})

describe("staggerDelays", () => {
  it("drops the dots one at a time, never taking longer than the cap in total", () => {
    expect(staggerDelays(3, 100, 2000)).toEqual([0, 100, 200])
    const many = staggerDelays(300, 100, 1500)
    expect(many).toHaveLength(300)
    expect(many[299]).toBeLessThanOrEqual(1500)
    expect(many[1]).toBeGreaterThan(0)
    expect(staggerDelays(0, 100, 1500)).toEqual([])
    expect(staggerDelays(1, 100, 1500)).toEqual([0])
  })
})
