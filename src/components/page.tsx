import * as React from "react"
import { cn } from "cn"

// Kit: .page, .page-header, .page-title, .page-lede, .page-section, .page-more

export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("mx-auto w-full max-w-[1120px] px-10 pt-12 pb-16", className)} {...props} />
}

export function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-6 flex items-end justify-between gap-10", className)} {...props} />
}

export function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("mb-2 text-4xl leading-tight font-bold tracking-tight", className)}
      {...props}
    />
  )
}

export function PageLede({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "max-w-[62ch] text-lg leading-relaxed text-ink-muted [&_b]:font-semibold [&_b]:text-ink",
        className
      )}
      {...props}
    />
  )
}

export function PageMore({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-8 text-base text-ink-muted", className)} {...props} />
}
