"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${path}`)
        setCopied(true)
      }}
    >
      {copied ? "Link copiato" : "Copia il link"}
    </Button>
  )
}
