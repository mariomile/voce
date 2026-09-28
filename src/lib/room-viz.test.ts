import { describe, expect, it } from "vitest"
import {
  bubbleLayout,
  bubbleTargets,
  dotOrderByX,
  fitSpacing,
  growBubble,
  pileLayout,
  pilePlaces,
  pileStep,
  roomGroups,
  staggerDelays,
  sunflower,
  themesLayout,
  themesScene,
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

  it("heaps up over the count, on the left, resting on the floor", () => {
    const { points, radius } = pileLayout(area, 12)
    const floor = area.y + area.height
    const lowest = Math.max(...points.map((p) => p.y))
    expect(lowest + radius).toBeGreaterThan(floor - 2 * radius)
    for (const p of points) expect(p.x).toBeLessThan(area.x + area.width * 0.6)
  })

  it("stays a heap, not a block, even when a step is almost full", () => {
    const { points } = pileLayout(area, 250)
    const top = Math.min(...points.map((p) => p.y))
    const topRow = points.filter((p) => p.y < top + 1)
    const bottomRow = points.filter((p) => p.y > Math.max(...points.map((q) => q.y)) - 1)
    expect(topRow.length).toBeLessThan(bottomRow.length / 2)
  })

  it("is empty for an area with no room", () => {
    expect(pileLayout({ x: 0, y: 0, width: 0, height: 0 }, 10).points).toHaveLength(0)
  })

  it("never shows fewer dots than responses, even in a cramped area", () => {
    for (const cramped of [{ x: 0, y: 0, width: 120, height: 30 }, { x: 5, y: 5, width: 40, height: 12 }]) {
      for (const count of [61, 500, 2400]) {
        const { points, radius } = pileLayout(cramped, count)
        expect(points).toHaveLength(count)
        expect(radius).toBeGreaterThan(0)
        for (const p of points) {
          expect(p.x - radius).toBeGreaterThanOrEqual(cramped.x - 0.001)
          expect(p.x + radius).toBeLessThanOrEqual(cramped.x + cramped.width + 0.001)
          expect(p.y - radius).toBeGreaterThanOrEqual(cramped.y - 0.001)
          expect(p.y + radius).toBeLessThanOrEqual(cramped.y + cramped.height + 0.001)
        }
      }
    }
  })
})

describe("pileStep and pilePlaces", () => {
  const area = { x: 100, y: 200, width: 900, height: 300 }

  it("rounds a count up to its step", () => {
    expect([0, 1, 60, 61, 250, 251, 2000, 2001, 3500].map(pileStep)).toEqual([60, 60, 60, 120, 250, 500, 2000, 3000, 4000])
  })

  it("lays out a whole step once: the pile of any count in the step is its first places", () => {
    const places = pilePlaces(area, pileStep(41))
    expect(places.points.length).toBeGreaterThanOrEqual(60)
    for (const count of [1, 41, 60]) {
      const pile = pileLayout(area, count)
      expect(pile.radius).toBe(places.radius)
      expect(pile.points).toEqual(places.points.slice(0, count))
    }
  })
})

describe("fitSpacing", () => {
  it("finds the largest value that still fits, between the bounds", () => {
    expect(fitSpacing(0, 100, (s) => s <= 37.5)).toBeCloseTo(37.5, 6)
    expect(fitSpacing(0, 10, () => true)).toBeCloseTo(10, 6)
    expect(fitSpacing(0, 10, (s) => s === 0)).toBeCloseTo(0, 6)
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

  it("keeps an empty last group when nothing is left: the responses that arrive later go there", () => {
    const groups = roomGroups([theme("a", 60), theme("b", 50)], 80)
    expect(groups.map((g) => [g.id, g.count])).toEqual([
      ["a", 60],
      ["b", 50],
      ["other", 0],
    ])
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

describe("growBubble", () => {
  const area = { x: 0, y: 100, width: 1600, height: 500 }
  const groups = [60, 45, 0].map((count) => ({ count, minWidth: 220 }))

  it("grows one bubble in place: same center line, same floor, one dot more per response", () => {
    const { bubbles, spacing, dotRadius } = bubbleLayout(area, groups, 24)
    const other = bubbles[2]
    const floor = other.cy + other.radius
    let previous = other.radius
    for (const count of [1, 3, 6]) {
      const grown = growBubble(other, count, spacing)
      expect(grown.points).toHaveLength(count)
      // Within its column a grown bubble keeps the dot size of every other bubble.
      expect(grown.dotRadius).toBeCloseTo(dotRadius, 6)
      expect(grown.cx).toBe(other.cx)
      expect(grown.column).toEqual(other.column)
      expect(grown.cy + grown.radius).toBeCloseTo(floor, 6)
      expect(grown.radius).toBeGreaterThan(previous)
      previous = grown.radius
      for (const p of grown.points) expect(Math.hypot(p.x - grown.cx, p.y - grown.cy) + grown.dotRadius).toBeLessThanOrEqual(grown.radius + 0.001)
    }
  })

  it("stays inside its column: past it, only its own dots get smaller", () => {
    const { bubbles, spacing } = bubbleLayout(area, groups, 24)
    const other = bubbles[2]
    const floor = other.cy + other.radius
    const grown = growBubble(other, 400, spacing)
    expect(grown.points).toHaveLength(400)
    expect(grown.radius).toBeLessThanOrEqual(other.column.width / 2 + 0.001)
    expect(grown.cy + grown.radius).toBeCloseTo(floor, 6)
    expect(grown.dotRadius).toBeLessThan(bubbles[0].dotRadius)
    expect(minDistance(grown.points)).toBeGreaterThanOrEqual(2 * grown.dotRadius)
  })

  it("uses the same dot spacing as the layout, so a grown bubble matches the others", () => {
    const { bubbles, spacing } = bubbleLayout(area, groups, 24)
    const regrown = growBubble(bubbles[0], 60, spacing)
    expect(regrown.radius).toBeCloseTo(bubbles[0].radius, 6)
    expect(regrown.points).toEqual(bubbles[0].points)
  })
})

describe("themesLayout", () => {
  const stage = { x: 64, y: 240, width: 1790, height: 700 }
  const groups = roomGroups([theme("a", 78), theme("b", 55, "opportunity"), theme("c", 41), theme("d", 30, "praise"), theme("e", 18, "opportunity")], 230)

  it("gives one bubble and one label per group, the bubbles with the group's count", () => {
    const layout = themesLayout(stage, groups)
    expect(layout.bubbles.map((b) => b.points.length)).toEqual(groups.map((g) => g.count))
    expect(layout.labels).toHaveLength(groups.length)
  })

  it("centers the row of bubbles in the top of the stage, all on one floor", () => {
    for (const size of [stage, { x: 0, y: 100, width: 800, height: 900 }, { x: 10, y: 10, width: 1200, height: 300 }]) {
      const { bubbles } = themesLayout(size, groups)
      const floor = bubbles[0].cy + bubbles[0].radius
      for (const b of bubbles) expect(b.cy + b.radius).toBeCloseTo(floor, 6)
      const top = Math.min(...bubbles.map((b) => b.cy - b.radius))
      const band = size.height * 0.6
      expect(top - size.y).toBeGreaterThanOrEqual(-0.001)
      expect(top - size.y).toBeCloseTo(size.y + band - floor, 6)
    }
  })

  it("puts each label under its bubble, in the stage's own coordinates", () => {
    const { bubbles, labels } = themesLayout(stage, groups)
    const floor = bubbles[0].cy + bubbles[0].radius - stage.y
    labels.forEach((label, i) => {
      expect(label.x).toBeCloseTo(bubbles[i].column.x - stage.x, 6)
      expect(label.width).toBeCloseTo(bubbles[i].column.width, 6)
      expect(label.x).toBeGreaterThanOrEqual(-0.001)
      expect(label.x + label.width).toBeLessThanOrEqual(stage.width + 0.001)
      expect(label.top).toBeGreaterThanOrEqual(floor + 10)
      expect(label.top).toBeLessThan(stage.height)
    })
  })

  it("gives an empty \"Altro\" about half the narrowest column of a theme", () => {
    const small = roomGroups([theme("a", 8), theme("b", 5), theme("c", 4)], 17)
    const { labels } = themesLayout(stage, small)
    const themeColumn = stage.width / (small.length + 1.5)
    for (const label of labels.slice(0, 3)) expect(label.width).toBeGreaterThanOrEqual(themeColumn - 0.001)
    expect(labels[3].width).toBeCloseTo(themeColumn * 0.55, 6)
  })

  it("keeps the columns at least 12 pixels apart, more on a wide stage", () => {
    for (const size of [stage, { x: 0, y: 0, width: 420, height: 400 }]) {
      const { labels } = themesLayout(size, groups)
      for (let i = 1; i < labels.length; i++) {
        const gap = labels[i].x - (labels[i - 1].x + labels[i - 1].width)
        expect(gap).toBeGreaterThanOrEqual(Math.max(12, size.width * 0.018) - 0.001)
      }
    }
  })
})

describe("themesScene", () => {
  const stage = { x: 64, y: 240, width: 1790, height: 700 }
  const themes = [theme("a", 40), theme("b", 25, "opportunity"), theme("c", 15, "praise")]
  const layout = themesLayout(stage, roomGroups(themes, 90))
  const order = Array.from({ length: 90 }, (_, i) => i)
  const byColor = (dots: { color: string }[]) =>
    dots.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.color]: (acc[d.color] ?? 0) + 1 }), {})

  it("gives one dot per group member, in the color of its group", () => {
    const scene = themesScene(layout, roomGroups(themes, 90), order)
    expect(scene.mode).toBe("bubbles")
    expect(byColor(scene.dots)).toEqual({ problem: 40, opportunity: 25, praise: 15, other: 10 })
    expect(scene.halos.map((h) => h.color)).toEqual(["problem", "opportunity", "praise", "other"])
  })

  it("grows only \"Altro\" with the responses that arrive later: the theme dots stay put", () => {
    const before = themesScene(layout, roomGroups(themes, 90), order)
    const after = themesScene(layout, roomGroups(themes, 120), order)
    expect(byColor(after.dots)).toEqual({ problem: 40, opportunity: 25, praise: 15, other: 40 })
    const themed = (dots: typeof before.dots) => dots.filter((d) => d.color !== "other")
    expect(themed(after.dots)).toEqual(themed(before.dots))
    expect(after.halos.slice(0, 3)).toEqual(before.halos.slice(0, 3))
    expect(after.halos[3].x).toBe(before.halos[3].x)
  })

  it("draws no halo around an empty \"Altro\"", () => {
    const full = themesLayout(stage, roomGroups(themes, 80))
    expect(themesScene(full, roomGroups(themes, 80), order.slice(0, 80)).halos.map((h) => h.color)).toEqual([
      "problem",
      "opportunity",
      "praise",
    ])
    expect(themesScene(full, roomGroups(themes, 83), order.slice(0, 80)).halos.at(-1)?.color).toBe("other")
  })

  it("wraps each bubble's dots in its halo", () => {
    const scene = themesScene(layout, roomGroups(themes, 90), order)
    for (const halo of scene.halos)
      for (const d of scene.dots.filter((d) => d.color === halo.color))
        expect(Math.hypot(d.x - halo.x, d.y - halo.y) + d.r).toBeLessThan(halo.r)
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

  it("drops the pile's dots that have no place left: feedback deleted after the analysis", () => {
    const bubbles = [{ points: [{ x: 1, y: 1 }] }, { points: [{ x: 2, y: 2 }] }]
    // Four dots in the pile at analysis time, two places now.
    const targets = bubbleTargets([3, 1, 0, 2], bubbles)
    expect(targets).toHaveLength(2)
    expect(targets[1]).toEqual({ x: 1, y: 1, group: 0 })
    expect(targets[0]).toEqual({ x: 2, y: 2, group: 1 })
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
