"use client"

import { useEffect, useRef, type ReactNode } from "react"

// Marks its box with data-inview the first time it is on screen, so the landing's CSS can run
// an entrance once. Without JavaScript the content is already in its final state.
export function InView({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.inview = ""
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
