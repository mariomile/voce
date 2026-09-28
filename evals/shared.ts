import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { isoDateOf } from "@/lib/format"
import type { AnalysisFeedback } from "@/lib/analysis"

// What the three evals share: the synthetic dataset, the results in evals/results/ (one file per run,
// named after its eval, so each run compares with the previous run of the same eval), and the checks on
// quoted spans.

export const RESULTS = "evals/results"

export type Dataset = {
  product: { name: string; description: string }
  feedback: { id: string; text: string; channel: string; received_days_ago: number }[]
  expected_themes: { title: string; kind: string; feedback: string[] }[]
  injections: { id: string; forbidden: string }[]
  previous_titles: string[]
}

export function loadDataset(): Dataset {
  return JSON.parse(readFileSync("evals/dataset.json", "utf8"))
}

export function datasetFeedback(dataset: Dataset): AnalysisFeedback[] {
  return dataset.feedback.map((f) => ({
    id: f.id,
    text: f.text,
    channel: f.channel,
    receivedAt: isoDateOf(new Date(Date.now() - f.received_days_ago * 24 * 60 * 60 * 1000)),
  }))
}

export function currentCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()
  } catch {
    return "unknown"
  }
}

type Summary = Record<string, unknown>

// The summary of the latest run of this eval, or null.
export function latestResult(kind: string, dir = RESULTS): Summary | null {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((f) => f.startsWith(`${kind}-`) && f.endsWith(".json"))
    .sort()
  const last = files.at(-1)
  return last ? (JSON.parse(readFileSync(join(dir, last), "utf8")).summary as Summary) : null
}

// Saves the run as {dir}/{kind}-{date}.json and returns the previous summary with a report that puts
// every number next to the one before.
export function saveResult(
  kind: string,
  record: { summary: Summary } & Record<string, unknown>,
  dir = RESULTS,
  date = new Date()
) {
  const previous = latestResult(kind, dir)
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `${kind}-${date.toISOString().replaceAll(":", "-").slice(0, 19)}.json`)
  writeFileSync(file, JSON.stringify(record, null, 2) + "\n")
  const lines = [`Salvata in ${file}`]
  for (const [key, value] of Object.entries(record.summary)) {
    if (key === "date") continue
    const before = previous?.[key]
    const shown = JSON.stringify(value)
    const changed = before !== undefined && JSON.stringify(before) !== shown
    lines.push(`  ${key}: ${typeof value === "string" ? value : shown}${changed ? `  (prima: ${typeof before === "string" ? before : JSON.stringify(before)})` : ""}`)
  }
  if (!previous) lines.push("  (nessun risultato precedente da confrontare)")
  return { file, previous, report: lines.join("\n") }
}

// Spans between quotation marks ("...", “...”, «...») in a text written by the model.
export function quotedSpans(text: string) {
  return [...text.matchAll(/"([^"]+)"|“([^”]+)”|«([^»]+)»/g)].map((m) => (m[1] ?? m[2] ?? m[3]).trim())
}

// Runs fn on every item, at most `concurrency` at a time, keeping the order of the items.
export async function mapLimited<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}
