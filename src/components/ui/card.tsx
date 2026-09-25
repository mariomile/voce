import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .card, .card-highlight, .card-soft, .card-row, .card-media
const cardVariants = cva("group/card flex rounded-lg p-6", {
  variants: {
    variant: {
      default: "bg-veil",
      // The recommended action. One per screen.
      highlight: "bg-highlight",
      // A warning that invites action, with the button on the right.
      soft: "bg-highlight-soft",
    },
    layout: {
      stack: "flex-col",
      row: "flex-row items-center justify-between gap-8",
      media: "grid grid-cols-[1fr_auto] gap-5",
    },
  },
  defaultVariants: { variant: "default", layout: "stack" },
})

function Card({
  className,
  variant = "default",
  layout = "stack",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-layout={layout}
      className={cn(cardVariants({ variant, layout }), className)}
      {...props}
    />
  )
}

function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-body" className={cn("flex flex-col", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("mb-1 text-xl leading-snug font-bold", className)}
      {...props}
    />
  )
}

function CardText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-text"
      className={cn(
        "mb-5 text-base leading-normal text-ink-muted group-data-[layout=row]/card:mb-0 group-data-[variant=highlight]/card:text-on-highlight group-data-[variant=soft]/card:text-on-highlight [&_b]:text-ink",
        className
      )}
      {...props}
    />
  )
}

function CardMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="card-meta" className={cn("mb-4 text-md font-semibold", className)} {...props} />
  )
}

function CardActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-actions" className={cn("mt-auto", className)} {...props} />
}

export { Card, CardBody, CardTitle, CardText, CardMeta, CardActions, cardVariants }
