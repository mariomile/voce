import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .badge (neutral pill for plan and counts) and the theme kinds
// (.badge-problem, .badge-opportunity, .badge-praise: dot and color, no fill).
// A badge is a label, never clickable.
const badgeVariants = cva("inline-flex items-center gap-2 font-semibold leading-normal", {
  variants: {
    variant: {
      default: "rounded-full bg-veil px-2 py-0.5 text-sm text-ink",
      problem: "text-md text-problem",
      opportunity: "text-md text-opportunity",
      praise: "text-md text-praise",
    },
  },
  compoundVariants: [
    {
      variant: ["problem", "opportunity", "praise"],
      className: "before:size-2 before:rounded-full before:bg-current before:content-['']",
    },
  ],
  defaultVariants: { variant: "default" },
})

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
