import * as React from "react"
import { cn } from "cn"

// Kit: .field with label, control, then hint, count or error.
// `quiet` makes the label light, when the value matters more than the name.

function Field({
  className,
  quiet = false,
  ...props
}: React.ComponentProps<"div"> & { quiet?: boolean }) {
  return (
    <div
      data-slot="field"
      data-quiet={quiet}
      className={cn("group/field flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "flex justify-between text-md font-semibold group-data-[quiet=true]/field:text-sm group-data-[quiet=true]/field:font-normal group-data-[quiet=true]/field:text-ink-muted",
        className
      )}
      {...props}
    />
  )
}

function FieldOptional({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("font-normal text-ink-subtle", className)} {...props} />
}

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm leading-normal text-ink-muted", className)} {...props} />
}

function FieldCount({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-right text-sm text-ink-subtle tabular-nums", className)} {...props} />
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm leading-normal text-problem", className)} {...props} />
}

export { Field, FieldLabel, FieldOptional, FieldHint, FieldCount, FieldError }
