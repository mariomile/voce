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
        line: "rounded-none border-b-[1.5px] border-line bg-transparent px-0 py-2 focus:border-ink aria-invalid:border-problem",
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
