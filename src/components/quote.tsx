import { cn } from "cn"

// Kit: .quote, .quote-sm, .quote-bar. The text is always the customer's own,
// rendered as text. The only markup is the <mark> the app adds around the key phrase.
export function Quote({
  text,
  highlight,
  cite,
  size = "default",
  bar = false,
  maxLength,
  className,
}: {
  text: string
  highlight?: string | null
  cite?: string
  size?: "default" | "sm"
  bar?: boolean
  maxLength?: number
  className?: string
}) {
  const shown = maxLength ? shorten(text, maxLength) : text
  const at = highlight ? shown.indexOf(highlight) : -1

  return (
    <blockquote
      className={cn(
        "m-0 max-w-[58ch] font-serif leading-relaxed font-normal",
        size === "sm" ? "text-xl" : "text-2xl",
        bar && "border-l-2 border-ink pl-4",
        className
      )}
    >
      “
      {at >= 0 && highlight ? (
        <>
          {shown.slice(0, at)}
          <mark>{highlight}</mark>
          {shown.slice(at + highlight.length)}
        </>
      ) : (
        shown
      )}
      ”
      {cite && (
        <cite className="mt-1 block font-sans text-sm text-ink-muted not-italic">{cite}</cite>
      )}
    </blockquote>
  )
}

// Cut on a word boundary. The ellipsis says the quote was shortened.
function shorten(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(" ")
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[.,;:!?]$/, "")}…`
}
