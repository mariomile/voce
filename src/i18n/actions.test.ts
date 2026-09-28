import { beforeEach, describe, expect, it, vi } from "vitest"

const jar = vi.hoisted(() => ({ set: vi.fn() }))
vi.mock("next/headers", () => ({ cookies: async () => jar }))

const { setLocale } = await import("./actions")

beforeEach(() => jar.set.mockClear())

describe("setLocale", () => {
  it("remembers the chosen language for a year, on every page", async () => {
    await setLocale("en")
    expect(jar.set).toHaveBeenCalledWith("NEXT_LOCALE", "en", { path: "/", maxAge: 31_536_000, sameSite: "lax" })
  })

  it("ignores a language Voce does not speak", async () => {
    await setLocale("fr" as never)
    expect(jar.set).not.toHaveBeenCalled()
  })
})
