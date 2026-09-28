import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Quote } from "./quote"
import { Textarea } from "./ui/textarea"

// The two kit extensions of "Chiedi" (DESIGN.md of the initiative, Components).

describe("kit extensions", () => {
  it("Textarea ask: paper, 1.5 px ink-muted inner border, 20 px sans, no resize", () => {
    const markup = renderToStaticMarkup(<Textarea variant="ask" rows={2} />)
    for (const token of ["bg-paper", "shadow-[inset_0_0_0_1.5px_var(--color-ink-muted)]", "text-2xl", "resize-none"])
      expect(markup).toContain(token)
    expect(markup).not.toContain("bg-veil")
    // The default variant is unchanged.
    expect(renderToStaticMarkup(<Textarea />)).toContain("bg-veil")
  })

  it("the cite of a quote is ink-muted, readable at 13 px", () => {
    const markup = renderToStaticMarkup(<Quote text="Testo" cite="Supporto, 12 settembre" />)
    expect(markup).toMatch(/<cite class="[^"]*text-ink-muted[^"]*">/)
    expect(markup).not.toContain("text-ink-subtle")
  })
})
