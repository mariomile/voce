import { describe, expect, it, vi } from "vitest"

// Every tab of a Research has its own browser title: the tab, or the theme, not the question again.
vi.mock("@/lib/data", () => ({
  getResearch: async () => ({ id: "r1", workspaceId: "ws", question: "Perché i clienti non esportano?" }),
  getTheme: async () => ({ id: "t1", title: "L'export in PDF è lento" }),
}))

const params = { params: Promise.resolve({ id: "r1", themeId: "t1" }) } as never

describe("page titles", () => {
  it("the Chiedi tab is titled Chiedi", async () => {
    const { generateMetadata } = await import("@/app/(app)/research/[id]/ask/page")
    expect((await generateMetadata()).title).toBe("Chiedi")
  })

  it("a theme page is titled with the theme", async () => {
    const { generateMetadata } = await import("@/app/(app)/research/[id]/themes/[themeId]/page")
    expect((await generateMetadata(params)).title).toBe("L'export in PDF è lento")
  })
})
