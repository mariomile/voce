import * as React from "react"
import { cn } from "cn"

// Kit: .page, .page-header, .page-title, .page-lede, .page-section, .page-more

export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("mx-auto w-full max-w-[1120px] px-5 pt-8 pb-16 sm:px-10 sm:pt-12", className)} {...props} />
}

export function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-10", className)} {...props} />
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

// The number of a step in the loop of a Research without feedback (1 ipotesi, 2 raccolta, 3 analisi):
// the order is the information, so it is shown; the title says the rest.
export function StepNumber({ step }: { step: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-base font-bold text-highlight tabular-nums"
    >
      {step}
    </span>
  )
}

// The title of a section of a Research tab (Ipotesi, Temi, the steps of a new Research): one size for all.
export function SectionHeading({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("flex items-center gap-3 text-3xl leading-tight font-extrabold tracking-tight", className)}
      {...props}
    />
  )
}
