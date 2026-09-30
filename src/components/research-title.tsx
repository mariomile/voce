"use client"

import { useEffect, useRef } from "react"

// Set by the question field once it has created a Research, read once by the title of the page that
// opens next: the arrival is announced, and only after a creation (no focus on normal visits).
let focusPending = false

export function focusNextResearchTitle() {
  focusPending = true
}

// The h1 of a Research: its question, as text.
export function ResearchTitle({ children }: { children: React.ReactNode }) {
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!focusPending) return
    focusPending = false
    title.current?.focus()
  }, [])
  return (
    <h1 ref={title} tabIndex={-1} className="max-w-[40ch] text-4xl leading-tight font-extrabold tracking-tight text-balance outline-none">
      {children}
    </h1>
  )
}
