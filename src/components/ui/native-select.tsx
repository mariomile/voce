import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .select with .select-empty, .select-strong, .select-positive.
// The tone follows the selected value, it is never picked by hand.
const nativeSelectVariants = cva(
  "w-full cursor-pointer appearance-none rounded-sm border-0 bg-no-repeat py-2 pr-8 pl-3 text-base leading-normal font-semibold [background-position:right_12px_center]",
  {
    variants: {
      tone: {
        default: "bg-veil bg-(image:--chevron-muted) text-ink",
        empty: "bg-veil bg-(image:--chevron-muted) font-normal text-ink-muted",
        strong: "bg-ink bg-(image:--chevron-paper) text-paper",
        positive: "bg-praise-soft bg-(image:--chevron-praise) text-praise-ink",
      },
    },
    defaultVariants: { tone: "default" },
  }
)

function NativeSelect({
  className,
  tone,
  ...props
}: React.ComponentProps<"select"> & VariantProps<typeof nativeSelectVariants>) {
  return (
    <select
      data-slot="native-select"
      className={cn(nativeSelectVariants({ tone }), className)}
      {...props}
    />
  )
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-paper font-normal text-ink", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOption, nativeSelectVariants }
