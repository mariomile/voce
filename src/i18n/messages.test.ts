import { describe, expect, it } from "vitest"
import { messages } from "./messages/index"

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) =>
      typeof value === "string" ? [[`${prefix}${key}`, value]] : Object.entries(flatten(value, `${prefix}${key}.`))
    )
  )
}

// The names inside {…}: "{count, plural, one {…}}" → count. The texts inside plural branches are not arguments.
function argumentsOf(message: string) {
  const names = new Set<string>()
  let depth = 0
  for (let i = 0; i < message.length; i++) {
    if (message[i] === "{") {
      if (depth % 2 === 0) names.add(message.slice(i + 1).match(/^\s*(\w+)/)?.[1] ?? "")
      depth++
    } else if (message[i] === "}") depth--
  }
  names.delete("")
  return [...names].sort()
}

// Rich text tags: <b>…</b>, <link>…</link>.
const tagsOf = (message: string) => [...new Set(message.match(/<\/?\w+>/g) ?? [])].sort()

const it_ = flatten(messages.it as Tree)
const en = flatten(messages.en as Tree)

describe("the English catalog", () => {
  it("has exactly the keys of the Italian one", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(it_).sort())
  })

  it("uses the same placeholders and tags in every message", () => {
    for (const key of Object.keys(it_)) {
      expect({ key, args: argumentsOf(en[key] ?? "") }).toEqual({ key, args: argumentsOf(it_[key]) })
      expect({ key, tags: tagsOf(en[key] ?? "") }).toEqual({ key, tags: tagsOf(it_[key]) })
    }
  })

  it("has no empty message and no em-dash", () => {
    for (const [key, message] of Object.entries(en)) {
      expect({ key, empty: message.trim() === "" }).toEqual({ key, empty: false })
      expect({ key, dash: message.includes("—") }).toEqual({ key, dash: false })
    }
  })
})
