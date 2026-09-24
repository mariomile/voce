"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { parseFeedbackCsv, type CsvInvalidRow, type CsvRow } from "@/lib/csv-import"
import { getCurrentWorkspace } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { CHANNEL_MAX_LENGTH, CUSTOMER_MAX_LENGTH, FEEDBACK_MAX_LENGTH } from "@/lib/plans"
import { createClient } from "@/lib/supabase/server"

// Every write runs as the signed-in user: RLS, column grants and the database functions decide
// what it can touch. The Free limit is enforced by the database on every insert.

// Postgres text cannot hold NUL characters.
const text = (schema: z.ZodString) => z.string().transform((t) => t.replaceAll("\0", "")).pipe(schema)

const manualFeedbackSchema = z.object({
  text: text(z.string().trim().min(1).max(FEEDBACK_MAX_LENGTH)),
  channel: text(z.string().trim().min(1).max(CHANNEL_MAX_LENGTH)),
  customer: text(z.string().trim().max(CUSTOMER_MAX_LENGTH)),
  receivedAt: z.union([z.literal(""), z.iso.date()]),
})

export type ManualFeedbackField = keyof z.infer<typeof manualFeedbackSchema>

export type AddFeedbackResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; fields: ManualFeedbackField[] }
  | { ok: false; reason: "limit" }

export async function addFeedback(input: z.input<typeof manualFeedbackSchema>): Promise<AddFeedbackResult> {
  const parsed = manualFeedbackSchema.safeParse(input)
  const today = isoDateOf(new Date())
  const future = parsed.success && parsed.data.receivedAt > today
  if (!parsed.success || future) {
    const fields = parsed.success ? [] : parsed.error.issues.map((i) => i.path[0] as ManualFeedbackField)
    return { ok: false, reason: "invalid", fields: future ? [...fields, "receivedAt"] : fields }
  }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { error } = await supabase.from("feedback").insert({
    workspace_id: workspace.id,
    text: parsed.data.text,
    channel: parsed.data.channel,
    customer: parsed.data.customer || null,
    received_at: parsed.data.receivedAt || today,
  })
  if (error?.message === "feedback_limit_reached") return { ok: false, reason: "limit" }
  if (error) throw error
  revalidatePath("/", "layout")
  return { ok: true }
}

export type CsvPreview = {
  ok: true
  newCount: number
  duplicateCount: number
  overLimitCount: number
  invalid: CsvInvalidRow[]
  // The first rows that will be saved, to check the columns were read right.
  sample: CsvRow[]
}

export type CsvImportResult = {
  ok: true
  imported: number
  duplicateCount: number
  overLimitCount: number
  invalidCount: number
}

type CsvError = { ok: false; error: string }

const SAMPLE_ROWS = 5

// The browser sends the file twice, for the preview and for the import. The server reads it
// again each time: what the browser showed is never trusted.
export async function previewCsv(formData: FormData): Promise<CsvPreview | CsvError> {
  const result = await runImport(formData, true)
  if (!result.ok) return result
  const saved = result.rows.filter((_, i) => result.outcomes[i] === "new")
  return {
    ok: true,
    newCount: saved.length,
    duplicateCount: result.outcomes.filter((o) => o === "duplicate").length,
    overLimitCount: result.outcomes.filter((o) => o === "over_limit").length,
    invalid: result.invalid,
    sample: saved.slice(0, SAMPLE_ROWS),
  }
}

export async function importCsv(formData: FormData): Promise<CsvImportResult | CsvError> {
  const result = await runImport(formData, false)
  if (!result.ok) return result
  revalidatePath("/", "layout")
  return {
    ok: true,
    imported: result.outcomes.filter((o) => o === "new").length,
    duplicateCount: result.outcomes.filter((o) => o === "duplicate").length,
    overLimitCount: result.outcomes.filter((o) => o === "over_limit").length,
    invalidCount: result.invalid.length,
  }
}

async function runImport(formData: FormData, dryRun: boolean) {
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false as const, error: "Scegli un file CSV." }
  const parsed = parseFeedbackCsv(new Uint8Array(await file.arrayBuffer()), isoDateOf(new Date()))
  if (!parsed.ok) return parsed
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("import_feedback", {
    ws: workspace.id,
    rows: parsed.rows.map((r) => ({
      text: r.text,
      channel: r.channel,
      customer: r.customer,
      received_at: r.receivedAt,
    })),
    dry_run: dryRun,
  })
  if (error) throw error
  const outcomes = data as ("new" | "duplicate" | "over_limit")[]
  return { ok: true as const, rows: parsed.rows, invalid: parsed.invalid, outcomes }
}

export async function setFormEnabled(enabled: boolean) {
  const parsed = z.boolean().safeParse(enabled)
  if (!parsed.success) return { ok: false as const }
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("workspaces")
    .update({ form_enabled: parsed.data })
    .eq("id", workspace.id)
    .select("id")
  if (error || data.length === 0) return { ok: false as const }
  revalidatePath("/", "layout")
  return { ok: true as const }
}

export async function regenerateFormLink() {
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { error } = await supabase.rpc("regenerate_form_link", { ws: workspace.id })
  if (error) return { ok: false as const }
  revalidatePath("/", "layout")
  return { ok: true as const }
}
