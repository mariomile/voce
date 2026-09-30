import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .filter-bar, .chip, .chip-count, .chip-menu, .filter-bar-sep.
// Chips filter, they never run actions. Active state: aria-pressed on buttons,
// aria-current on links.
const chipVariants = cva(
  "inline-flex cursor-pointer items-center rounded-full border-0 bg-veil py-2 text-md leading-snug text-ink-muted no-underline aria-pressed:bg-ink aria-pressed:font-semibold aria-pressed:text-paper aria-[current=true]:bg-ink aria-[current=true]:font-semibold aria-[current=true]:text-paper",
  {
    variants: {
      menu: {
        false: "px-4",
        true: "bg-(image:--chevron-muted) bg-no-repeat pr-8 pl-4 [background-position:right_12px_center] [&_b]:font-semibold [&_b]:text-ink",
      },
    },
    defaultVariants: { menu: false },
  }
)

function ChipCount({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-1 tabular-nums opacity-80", className)} {...props} />
}

function FilterBar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-bar"
      className={cn("flex flex-wrap items-center gap-2 border-b border-ink pb-5", className)}
      {...props}
    />
  )
}

function FilterBarSep() {
  return <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
}

type ChipVariantProps = VariantProps<typeof chipVariants>

export { chipVariants, ChipCount, FilterBar, FilterBarSep, type ChipVariantProps }
