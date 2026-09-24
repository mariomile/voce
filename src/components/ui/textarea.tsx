import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .textarea (app) and .textarea-line (public form only, serif).
// Height comes from `rows`, not CSS.
const textareaVariants = cva("w-full border-0 placeholder:text-ink-subtle", {
  variants: {
    variant: {
      default:
        "resize-y rounded-sm bg-veil px-3 py-2 text-lg leading-normal aria-invalid:shadow-[inset_0_0_0_1.5px_var(--color-problem)]",
      line: "resize-none rounded-none border-b-[1.5px] border-line bg-transparent px-0 py-2 font-serif text-2xl leading-relaxed placeholder:italic focus:border-ink aria-invalid:border-problem",
    },
  },
  defaultVariants: { variant: "default" },
})

function Textarea({
  className,
  variant,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
