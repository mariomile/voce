import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Kit: .btn, .btn-secondary, .btn-highlight, .btn-lg, .btn-sm, .link, .link-text
const buttonStyles = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 font-semibold leading-snug whitespace-nowrap no-underline disabled:cursor-not-allowed disabled:bg-veil disabled:text-ink-subtle aria-disabled:cursor-not-allowed aria-disabled:bg-veil aria-disabled:text-ink-subtle",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-ink-hover",
        // On a card the secondary turns white, to stand out from the veil.
        secondary:
          "bg-veil text-ink hover:bg-line in-data-[slot=card]:bg-paper",
        highlight: "bg-highlight text-ink hover:bg-highlight-hover",
        // Goes somewhere: the yellow underline says "this way".
        link: "rounded-none bg-transparent p-0 text-ink underline decoration-highlight decoration-3 underline-offset-4",
        // Acts in place (Modifica, Elimina, Annulla, Esci): a neutral underline, so the yellow keeps its meaning.
        text: "rounded-none bg-transparent p-0 text-ink underline decoration-ink-subtle decoration-2 underline-offset-4 hover:decoration-ink",
      },
      size: {
        default: "px-5 py-3 text-base",
        lg: "px-6 py-4 text-lg",
        // Small actions next to content: Copia and the follow-ups of an answer in Chiedi.
        sm: "px-4 py-2 text-md",
      },
    },
    compoundVariants: [
      {
        variant: ["link", "text"],
        className: "p-0 text-base disabled:bg-transparent aria-disabled:bg-transparent",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Merged, so the link variant's p-0 wins over the size padding when used on <Link>.
function buttonVariants(props?: Parameters<typeof buttonStyles>[0]) {
  return cn(buttonStyles(props))
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonStyles>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
