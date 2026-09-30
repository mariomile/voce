import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .textarea (app), .textarea-line (public form only, serif) and .textarea-ask (the question
// of Chiedi, readable from a projector: paper with a 1.5 px ink-muted border).
// Height comes from `rows`, not CSS.
const textareaVariants = cva("w-full border-0 placeholder:text-ink-subtle", {
  variants: {
    variant: {
      default:
        "resize-y rounded-sm bg-veil px-3 py-2 text-lg leading-normal aria-invalid:shadow-[inset_0_0_0_1.5px_var(--color-problem)]",
      // Focus: the ring sits on the edge (no offset) and the border turns ink, one solid frame instead of a
      // ring floating around a grey border.
      ask: "resize-none rounded-sm bg-paper px-4 py-3 text-2xl leading-normal shadow-[inset_0_0_0_1.5px_var(--color-ink-muted)] focus-visible:shadow-[inset_0_0_0_1.5px_var(--color-ink)] focus-visible:outline-offset-0 aria-invalid:shadow-[inset_0_0_0_1.5px_var(--color-problem)]",
      // The focus is the line turning ink, not the global ring: ring and line together read as a double border.
      line: "resize-none rounded-none border-b-2 border-line bg-transparent px-0 py-2 font-serif text-2xl leading-relaxed placeholder:text-ink-muted placeholder:italic focus:border-ink focus-visible:outline-hidden aria-invalid:border-problem",
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
