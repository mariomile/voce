import { beforeEach, describe, expect, it, vi } from "vitest"

// /sala with the workspace's last Research chosen by the test; redirect() throws, as in Next.
const data = vi.hoisted(() => ({ latest: null as string | null, askedFor: [] as string[] }))
vi.mock("@/lib/data", () => ({
  getCurrentWorkspace: async () => ({ id: "ws-1", name: "Acme" }),
  getLatestResearchId: async (workspaceId: string) => {
    data.askedFor.push(workspaceId)
    return data.latest
  },
}))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Redirect(path)
  },
}))
class Redirect extends Error {
  constructor(readonly path: string) {
    super(path)
  }
}

const { GET } = await import("./route")

async function landing() {
  try {
    await GET()
  } catch (error) {
    if (error instanceof Redirect) return error.path
    throw error
  }
  throw new Error("no redirect")
}

beforeEach(() => {
  data.latest = null
  data.askedFor = []
})

describe("/sala", () => {
  it("opens the room of the Research created last in the workspace", async () => {
    data.latest = "c0da4133-bc0b-4f26-8173-0df8c282cce9"
    expect(await landing()).toBe("/research/c0da4133-bc0b-4f26-8173-0df8c282cce9/sala")
    expect(data.askedFor).toEqual(["ws-1"])
  })

  it("with no Research goes to the list", async () => {
    expect(await landing()).toBe("/research")
  })
})
