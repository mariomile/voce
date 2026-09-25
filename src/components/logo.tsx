import { cn } from "cn"

// Kit: .logo (the Voce mark) and .avatar (the workspace initial)
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 flex-none place-items-center rounded-full bg-ink text-sm font-bold text-highlight",
        className
      )}
    >
      v
    </span>
  )
}

export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid size-7 flex-none place-items-center rounded-sm bg-ink text-sm font-bold text-paper"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
