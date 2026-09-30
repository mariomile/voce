import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .input (app) and .input-line (public form only)
const inputVariants = cva(
  "w-full min-w-0 border-0 text-lg leading-normal outline-offset-2 placeholder:text-ink-subtle",
  {
    variants: {
      variant: {
        default:
          "rounded-sm bg-veil px-3 py-2 aria-invalid:shadow-[inset_0_0_0_1.5px_var(--color-problem)]",
        // Like the line textarea: the focus is the line turning ink. 44 px tall, a comfortable tap.
        line: "rounded-none border-b-2 border-line bg-transparent px-0 py-2.5 placeholder:text-ink-muted focus:border-ink focus-visible:outline-hidden aria-invalid:border-problem",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Input({
  className,
  variant,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
