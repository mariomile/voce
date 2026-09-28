"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CopyLinkButton({ path }: { path: string }) {
  const t = useTranslations("collect.copyLink")
  const [copied, setCopied] = useState(false)
  return (
    <Button
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${path}`)
        setCopied(true)
      }}
    >
      {copied ? t("copied") : t("copy")}
    </Button>
  )
}
