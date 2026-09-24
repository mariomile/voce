"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { chipVariants } from "@/components/ui/chip"
import { STATUS_LABELS } from "@/lib/format"

const OPTIONS: Record<string, string> = {
  open: "aperti",
  all: "tutti",
  ...Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.toLowerCase()])),
}

// Kit: .chip-menu. Filters themes by status through the URL.
export function StatusMenu({ value }: { value: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
        Stato:&nbsp;<b>{OPTIONS[value]}</b>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => select(String(v))}>
          {Object.entries(OPTIONS).map(([key, label]) => (
            <DropdownMenuRadioItem key={key} value={key}>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
