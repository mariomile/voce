"use server"

import { getLocale, getTranslations } from "next-intl/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { trackMilestone } from "@/lib/analytics"
import { parseFeedbackCsv, type CsvInvalidRow, type CsvRow } from "@/lib/csv-import"
import { getCurrentWorkspace } from "@/lib/data"
import { isoDateOf } from "@/lib/format"
import { CHANNEL_MAX_LENGTH, CUSTOMER_MAX_LENGTH, FORM_QUESTION_MAX_LENGTH, NOTES_MAX_LENGTH } from "@/lib/plans"
import { workspaceOfCollectedResearch } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Every write runs as the signed-in user: RLS, column grants and the database functions decide
// what it can touch. The Free limit is enforced by the database on every insert. The Research id
// comes from the page: a Research of another workspace is refused by the database (RLS, the composite
// key of feedback, the membership checks of the functions).

// Postgres text cannot hold NUL characters.
const text = (schema: z.ZodString) => z.string().transform((t) => t.replaceAll("\0", "")).pipe(schema)
const researchIdSchema = z.uuid()

// Interview notes: one person, one set of notes, one feedback. The channel defaults to "Intervista"
// (in the language of the interface) and can be changed, for a message copied from an email or Slack.
const notesSchema = z.object({
  text: text(z.string().trim().min(1)),
  channel: text(z.string().trim().max(CHANNEL_MAX_LENGTH)),
  customer: text(z.string().trim().max(CUSTOMER_MAX_LENGTH)),
  receivedAt: z.union([z.literal(""), z.iso.date()]),
})

export type NotesField = keyof z.infer<typeof notesSchema>

export type AddNotesResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; fields: NotesField[] }
  | { ok: false; reason: "too_long" | "future_date" | "limit" | "session" }

export async function addNotes(researchId: string, input: z.input<typeof notesSchema>): Promise<AddNotesResult> {
  if (!researchIdSchema.safeParse(researchId).success) return { ok: false, reason: "invalid", fields: [] }
  const parsed = notesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, reason: "invalid", fields: parsed.error.issues.map((i) => i.path[0] as NotesField) }
  }
  // Counted like char_length in the database: characters, not UTF-16 units.
  if ([...parsed.data.text].length > NOTES_MAX_LENGTH) return { ok: false, reason: "too_long" }
  const today = isoDateOf(new Date())
  if (parsed.data.receivedAt > today) return { ok: false, reason: "future_date" }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, reason: "session" }
  const workspace = await getCurrentWorkspace()
  const channel = parsed.data.channel || (await getTranslations("research.notes"))("defaultChannel")
  const { error } = await supabase.from("feedback").insert({
    workspace_id: workspace.id,
    research_id: researchId,
    text: parsed.data.text,
    channel,
    customer: parsed.data.customer || null,
    received_at: parsed.data.receivedAt || today,
  })
  if (error?.message === "feedback_limit_reached") return { ok: false, reason: "limit" }
  if (error) throw error
  trackMilestone(workspace.id, { event: "first_feedback_added", properties: { source: "manual" } })
  trackCollected(researchId)
  revalidatePath("/", "layout")
  return { ok: true }
}

// Sent once per workspace, by the feedback that brings one of its Research to 5.
function trackCollected(researchId: string) {
  trackMilestone(() => workspaceOfCollectedResearch({ id: researchId }), {
    event: "first_research_collected",
    properties: {},
  })
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
export async function previewCsv(researchId: string, formData: FormData): Promise<CsvPreview | CsvError> {
  const result = await runImport(researchId, formData, true)
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

export async function importCsv(researchId: string, formData: FormData): Promise<CsvImportResult | CsvError> {
  const result = await runImport(researchId, formData, false)
  if (!result.ok) return result
  const imported = result.outcomes.filter((o) => o === "new").length
  if (imported > 0) {
    trackMilestone(result.workspaceId, { event: "first_feedback_added", properties: { source: "csv" } })
    trackCollected(researchId)
  }
  revalidatePath("/", "layout")
  return {
    ok: true,
    imported,
    duplicateCount: result.outcomes.filter((o) => o === "duplicate").length,
    overLimitCount: result.outcomes.filter((o) => o === "over_limit").length,
    invalidCount: result.invalid.length,
  }
}

async function runImport(researchId: string, formData: FormData, dryRun: boolean) {
  researchIdSchema.parse(researchId)
  const t = await getTranslations("collect")
  const file = formData.get("file")
  if (!(file instanceof File)) return { ok: false as const, error: t("csvImport.chooseFileError") }
  const locale = await getLocale()
  const parsed = parseFeedbackCsv(new Uint8Array(await file.arrayBuffer()), isoDateOf(new Date()), t, locale)
  if (!parsed.ok) return parsed
  const workspace = await getCurrentWorkspace()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("import_feedback", {
    ws: workspace.id,
    research: researchId,
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
  return { ok: true as const, workspaceId: workspace.id, rows: parsed.rows, invalid: parsed.invalid, outcomes }
}

export async function setFormEnabled(researchId: string, enabled: boolean) {
  const parsed = z.boolean().safeParse(enabled)
  if (!parsed.success || !researchIdSchema.safeParse(researchId).success) return { ok: false as const }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("research")
    .update({ form_enabled: parsed.data })
    .eq("id", researchId)
    .select("id")
  if (error || data.length === 0) return { ok: false as const }
  revalidatePath("/", "layout")
  return { ok: true as const }
}

export async function regenerateFormLink(researchId: string) {
  if (!researchIdSchema.safeParse(researchId).success) return { ok: false as const }
  const supabase = await createClient()
  const { error } = await supabase.rpc("regenerate_form_link", { research: researchId })
  if (error) return { ok: false as const }
  revalidatePath("/", "layout")
  return { ok: true as const }
}

// Empty means the default question, which the database builds from the workspace name.
export async function setFormQuestion(researchId: string, question: string) {
  const parsed = text(z.string().trim().max(FORM_QUESTION_MAX_LENGTH)).safeParse(question)
  if (!parsed.success || !researchIdSchema.safeParse(researchId).success) return { ok: false as const }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("research")
    .update({ form_question: parsed.data || null })
    .eq("id", researchId)
    .select("id")
  if (error || data.length === 0) return { ok: false as const }
  revalidatePath("/", "layout")
  return { ok: true as const }
}
