"use client"

import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { chipVariants } from "@/components/ui/chip"

const STATUS_KEYS = ["to_review", "roadmap", "done", "discarded"] as const

// Kit: .chip-menu. Filters themes by status through the URL.
export function StatusMenu({ value }: { value: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("themes.statusMenu")
  const tStatus = useTranslations("common.status")

  const options: Record<string, string> = {
    open: t("open"),
    all: t("all"),
    ...Object.fromEntries(STATUS_KEYS.map((k) => [k, tStatus(k).toLowerCase()])),
  }

  function select(next: string) {
    const params = new URLSearchParams(searchParams)
    if (next === "open") params.delete("status")
    else params.set("status", next)
    params.delete("all")
    router.push(`?${params}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={chipVariants({ menu: true })}>
        {t("label")}:&nbsp;<b>{options[value]}</b>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => select(String(v))}>
          {Object.entries(options).map(([key, label]) => (
            // Radio items keep the menu open by default: a filter closes it, like choosing a link.
            <DropdownMenuRadioItem key={key} value={key} closeOnClick>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
