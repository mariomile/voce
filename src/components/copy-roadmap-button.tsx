"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CopyRoadmapButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(markdown)
        setCopied(true)
      }}
    >
      {copied ? "Copiato" : "Copia per la roadmap"}
    </Button>
  )
}
