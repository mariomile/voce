"use client"

import { useEffect, useRef } from "react"
import { staggerDelays } from "@/lib/room-viz"

// The room screen's dots, drawn on one canvas behind the text. React only hands over where each
// dot should be (a scene); this component keeps the dots in memory and animates them frame by
// frame, one fill per color, and stops drawing when nothing moves. Dot i of one scene is dot i of
// the next: that is how the pile flies into the bubbles and back.

export type DotColor = "ink" | "problem" | "opportunity" | "praise" | "other"
export type SceneDot = { x: number; y: number; r: number; color: DotColor }
export type Halo = { x: number; y: number; r: number; color: DotColor }
export type Scene = { mode: "pile" | "bubbles"; dots: SceneDot[]; halos: Halo[] }

const COLOR_VARS: Record<DotColor, string> = {
  ink: "--color-ink",
  problem: "--color-problem",
  opportunity: "--color-opportunity",
  praise: "--color-praise",
  other: "--color-ink-subtle",
}

type Motion = "drop" | "fly" | "move" | "grow" | "shrink"
type Dot = {
  x: number
  y: number
  r: number
  color: DotColor
  from: SceneDot
  to: SceneDot
  motion: Motion
  start: number
  duration: number
  lift: number
  // A dot that landed from a live response leaves a ring on the pile.
  ripple: boolean
  done: boolean
  phase: number
}
type Ripple = { x: number; y: number; r: number; start: number }

const HALO_ALPHA = 0.1
const RIPPLE_MS = 700

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function RoomDots({ scene, alive, hidden }: { scene: Scene | null; alive: boolean; hidden: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engine = useRef<ReturnType<typeof createEngine> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const e = createEngine(canvas)
    engine.current = e
    return () => {
      e.destroy()
      engine.current = null
    }
  }, [])

  useEffect(() => {
    if (scene) engine.current?.setScene(scene)
  }, [scene])

  useEffect(() => {
    engine.current?.setAlive(alive)
  }, [alive])

  useEffect(() => {
    engine.current?.setHidden(hidden)
  }, [hidden])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-testid="room-dots"
      data-dots={scene?.dots.length ?? 0}
      className="room-dots pointer-events-none absolute inset-0 size-full"
      style={{ opacity: hidden ? 0 : 1 }}
    />
  )
}

function createEngine(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!
  const styles = getComputedStyle(canvas)
  const colors = Object.fromEntries(
    (Object.keys(COLOR_VARS) as DotColor[]).map((c) => [c, styles.getPropertyValue(COLOR_VARS[c]).trim() || "#1e2127"])
  ) as Record<DotColor, string>
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

  let dots: Dot[] = []
  let dying: Dot[] = []
  let ripples: Ripple[] = []
  let halos: Halo[] = []
  let haloAlpha = 0
  let mode: Scene["mode"] | null = null
  let alive = false
  // Behind the list view: the dots keep moving to their places, nothing is drawn.
  let hidden = false
  let aliveLevel = 0
  let frame = 0
  let width = 0
  let height = 0
  let last = 0

  function resize() {
    const dpr = window.devicePixelRatio || 1
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(performance.now())
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  function animate(dot: Dot, to: SceneDot, motion: Motion, start: number, duration: number, lift = 0) {
    dot.from = { x: dot.x, y: dot.y, r: dot.r, color: dot.color }
    dot.to = to
    dot.motion = motion
    dot.start = start
    dot.duration = duration
    dot.lift = lift
    dot.done = false
  }

  function newDot(to: SceneDot): Dot {
    return {
      ...to,
      from: to,
      to,
      motion: "move",
      start: 0,
      duration: 0,
      lift: 0,
      ripple: false,
      done: true,
      phase: Math.random() * Math.PI * 2,
    }
  }

  function setScene(scene: Scene) {
    const now = performance.now()
    const still = reduced.matches
    const modeChanged = mode !== null && mode !== scene.mode
    const firstScene = mode === null
    mode = scene.mode
    halos = scene.halos
    if (still) haloAlpha = halos.length ? HALO_ALPHA : 0

    // Dots that stay: fly to the other act, or slide to their new place.
    const kept = Math.min(dots.length, scene.dots.length)
    for (let i = 0; i < kept; i++) {
      const dot = dots[i]
      const to = scene.dots[i]
      if (still) {
        Object.assign(dot, to, { from: to, to, done: true })
        continue
      }
      const same = dot.to.x === to.x && dot.to.y === to.y && dot.to.r === to.r && dot.to.color === to.color
      if (same && !modeChanged) continue
      if (modeChanged) {
        const distance = Math.hypot(to.x - dot.x, to.y - dot.y)
        animate(dot, to, "fly", now + Math.random() * 450, 900 + Math.random() * 400, Math.min(260, distance * 0.35))
      } else if (dot.motion === "drop" && !dot.done) {
        // Still falling: land on the new place instead.
        dot.to = to
      } else {
        animate(dot, to, "move", now, 600)
      }
    }

    // Dots that go: they shrink away.
    for (const dot of dots.slice(scene.dots.length)) {
      animate(dot, { ...dot, r: 0 }, "shrink", now, still ? 0 : 300)
      dying.push(dot)
    }
    dots = dots.slice(0, scene.dots.length)

    // Dots that arrive: they fall into the pile one at a time, or appear in their bubble.
    const added = scene.dots.slice(kept)
    const delays = firstScene ? staggerDelays(added.length, 25, 1200) : staggerDelays(added.length, 110, 2400)
    added.forEach((to, k) => {
      const dot = newDot(to)
      dots.push(dot)
      if (still) return
      if (scene.mode === "pile") {
        dot.x = to.x + (Math.random() - 0.5) * to.r * 4
        dot.y = -to.r * 2 - Math.random() * 60
        const fall = Math.max(0, to.y - dot.y)
        animate(dot, to, "drop", now + delays[k], 320 + Math.sqrt(fall) * 20)
        dot.ripple = !firstScene
      } else {
        dot.r = 0
        animate(dot, to, "grow", now + (modeChanged ? 900 : 0) + delays[k], 450)
      }
    })
    if (still) dying = []
    kick()
  }

  function setHidden(next: boolean) {
    hidden = next
    if (!hidden) draw(performance.now())
  }

  function setAlive(next: boolean) {
    alive = next && !reduced.matches
    kick()
  }

  // Position of a dot at a given time; returns true while it still moves.
  function step(dot: Dot, now: number) {
    if (dot.done) return false
    const t = dot.duration > 0 ? Math.min(1, Math.max(0, (now - dot.start) / dot.duration)) : 1
    const { from, to } = dot
    if (dot.motion === "drop") {
      // Falls with gravity, then settles with a small hop.
      const fall = 0.82
      if (t < fall) {
        const u = t / fall
        dot.x = from.x + (to.x - from.x) * easeOut(u)
        dot.y = from.y + (to.y - from.y) * u * u
      } else {
        const u = (t - fall) / (1 - fall)
        dot.x = to.x
        dot.y = to.y - Math.sin(u * Math.PI) * to.r * 0.5
      }
      dot.r = to.r
      dot.color = to.color
    } else if (dot.motion === "fly") {
      // A curved flight: out of the pile, up, and down into the bubble.
      const u = easeInOut(t)
      const cx = (from.x + to.x) / 2
      const cy = Math.min(from.y, to.y) - dot.lift
      dot.x = (1 - u) ** 2 * from.x + 2 * (1 - u) * u * cx + u * u * to.x
      dot.y = (1 - u) ** 2 * from.y + 2 * (1 - u) * u * cy + u * u * to.y
      dot.r = from.r + (to.r - from.r) * u
      dot.color = u < 0.5 ? from.color : to.color
    } else {
      const u = easeOut(t)
      dot.x = from.x + (to.x - from.x) * u
      dot.y = from.y + (to.y - from.y) * u
      dot.r = from.r + (to.r - from.r) * u
      dot.color = to.color
    }
    if (t >= 1) {
      dot.done = true
      if (dot.ripple) {
        ripples.push({ x: to.x, y: to.y, r: to.r, start: now })
        dot.ripple = false
      }
    }
    return true
  }

  const buckets = new Map<DotColor, Dot[]>()
  function bucket(dot: Dot) {
    if (dot.r <= 0.1) return
    let list = buckets.get(dot.color)
    if (!list) buckets.set(dot.color, (list = []))
    list.push(dot)
  }

  function draw(now: number) {
    if (hidden) return
    ctx.clearRect(0, 0, width, height)

    if (haloAlpha > 0.001) {
      ctx.globalAlpha = haloAlpha
      for (const h of halos) {
        ctx.fillStyle = colors[h.color]
        ctx.beginPath()
        ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    for (const list of buckets.values()) list.length = 0
    for (const dot of dots) bucket(dot)
    for (const dot of dying) bucket(dot)

    // While the analysis runs the pile breathes: a slow wave rolls through it.
    const wave = now / 1000
    for (const [color, list] of buckets) {
      if (!list.length) continue
      ctx.fillStyle = colors[color]
      ctx.beginPath()
      for (const dot of list) {
        let y = dot.y
        if (aliveLevel > 0.001) {
          const s = Math.sin(wave * 3.2 - dot.x * 0.012 + dot.phase * 0.35)
          y -= aliveLevel * dot.r * 1.1 * Math.max(0, s) ** 3
        }
        ctx.moveTo(dot.x + dot.r, y)
        ctx.arc(dot.x, y, dot.r, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    if (ripples.length) {
      ctx.strokeStyle = colors.ink
      ctx.lineWidth = 2
      for (const ripple of ripples) {
        const t = (now - ripple.start) / RIPPLE_MS
        ctx.globalAlpha = 0.45 * (1 - t)
        ctx.beginPath()
        ctx.arc(ripple.x, ripple.y, ripple.r * (1 + t * 2.6), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
  }

  function tick(now: number) {
    frame = 0
    const dt = Math.min(64, now - (last || now))
    last = now
    let moving = false
    for (const dot of dots) if (step(dot, now)) moving = true
    for (const dot of dying) step(dot, now)
    dying = dying.filter((d) => !d.done)
    ripples = ripples.filter((r) => now - r.start < RIPPLE_MS)

    const aliveTarget = alive ? 1 : 0
    aliveLevel += (aliveTarget - aliveLevel) * Math.min(1, dt / 300)
    if (Math.abs(aliveTarget - aliveLevel) < 0.001) aliveLevel = aliveTarget
    const haloTarget = halos.length && dots.every((d) => d.done) ? HALO_ALPHA : halos.length ? haloAlpha : 0
    haloAlpha += (haloTarget - haloAlpha) * Math.min(1, dt / 250)
    if (Math.abs(haloTarget - haloAlpha) < 0.001) haloAlpha = haloTarget

    draw(now)
    if (moving || dying.length || ripples.length || aliveLevel > 0 || haloAlpha !== haloTarget) {
      frame = requestAnimationFrame(tick)
    } else {
      last = 0
    }
  }

  function kick() {
    if (!frame) frame = requestAnimationFrame(tick)
  }

  function destroy() {
    observer.disconnect()
    cancelAnimationFrame(frame)
  }

  return { setScene, setAlive, setHidden, destroy }
}
