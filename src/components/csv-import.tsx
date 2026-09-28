"use client"

import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useRef, useState, useTransition } from "react"
import { importCsv, previewCsv, type CsvImportResult, type CsvPreview } from "@/app/(app)/research/[id]/collect/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Locale } from "@/i18n/locale"
import { formatDate, formatNumber } from "@/lib/format"
import { CSV_MAX_BYTES, CSV_MAX_ROWS } from "@/lib/plans"

const VISIBLE_INVALID = 50

// Pick a file → the server reads it and says what would happen → import. Nothing is saved before.
export function CsvImport({ researchId }: { researchId: string }) {
  const t = useTranslations("collect.csvImport")
  const locale = useLocale()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (input.current) input.current.value = ""
  }

  function choose(chosen: File | undefined) {
    reset()
    if (!chosen) return
    if (chosen.size > CSV_MAX_BYTES) {
      setError(t("sizeError"))
      return
    }
    setFile(chosen)
    startTransition(async () => {
      const response = await previewCsv(researchId, formDataOf(chosen))
      if (response.ok) setPreview(response)
      else setError(response.error)
    })
  }

  function save() {
    if (!file) return
    startTransition(async () => {
      const response = await importCsv(researchId, formDataOf(file))
      if (response.ok) {
        setPreview(null)
        setResult(response)
      } else setError(response.error)
    })
  }

  const picker = (
    <input
      ref={input}
      type="file"
      accept=".csv,text/csv"
      className="hidden"
      onChange={(e) => choose(e.target.files?.[0])}
    />
  )

  if (result)
    return (
      <div className="flex flex-col items-start gap-4">
        {picker}
        <p className="text-lg leading-relaxed [&_b]:font-semibold">
          <b>{t("imported", { count: result.imported, n: formatNumber(result.imported, locale) })}</b>
          {ignoredSummary(t, locale, result.duplicateCount, result.invalidCount, result.overLimitCount)}
        </p>
        <div className="flex gap-3">
          <Link href="/feedback" className={buttonVariants()}>
            {t("seeFeedback")}
          </Link>
          <Button variant="secondary" onClick={() => input.current?.click()}>
            {t("importAnother")}
          </Button>
        </div>
      </div>
    )

  if (preview && file)
    return (
      <div className="flex flex-col gap-6">
        {picker}
        <div>
          <p className="mb-1 text-md text-ink-subtle">{file.name}</p>
          <p className="text-lg leading-relaxed [&_b]:font-semibold">
            <b>{t("toImport", { count: preview.newCount, n: formatNumber(preview.newCount, locale) })}</b>
            {ignoredSummary(t, locale, preview.duplicateCount, preview.invalid.length, preview.overLimitCount)}
          </p>
        </div>

        {preview.overLimitCount > 0 && (
          <Card variant="soft">
            <CardTitle>{t("freeLimitTitle")}</CardTitle>
            <CardText className="mb-0">
              {preview.newCount === 0
                ? preview.overLimitCount === 1
                  ? t("overLimitNoneOne")
                  : t("overLimitNoneMany", { n: formatNumber(preview.overLimitCount, locale) })
                : t("overLimitSome", {
                    n: formatNumber(preview.newCount, locale),
                    m: formatNumber(preview.overLimitCount, locale),
                  })}{" "}
              {t("proUnlimited")}
            </CardText>
          </Card>
        )}

        {preview.sample.length > 0 && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {preview.sample.length < preview.newCount ? t("rowsHeadingPartial") : t("rowsHeadingFull")}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableFeedback")}</TableHead>
                  <TableHead>{t("tableChannel")}</TableHead>
                  <TableHead>{t("tableCustomer")}</TableHead>
                  <TableHead className="text-right">{t("tableDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.sample.map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="max-w-[64ch]">{row.text}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink-muted">{row.channel}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink-muted">{row.customer}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {row.receivedAt ? formatDate(row.receivedAt, locale) : t("todayCell")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {preview.invalid.length > 0 && (
          <div>
            <h3 className="mb-1 text-xl font-bold">
              {t("invalidHeading", { count: preview.invalid.length, n: formatNumber(preview.invalid.length, locale) })}
            </h3>
            <p className="mb-2 text-base text-ink-muted">{t("invalidHint")}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("invalidRow")}</TableHead>
                  <TableHead>{t("invalidReason")}</TableHead>
                  <TableHead>{t("invalidText")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.invalid.slice(0, VISIBLE_INVALID).map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="text-right align-top tabular-nums">{row.line}</TableCell>
                    <TableCell className="max-w-[40ch] align-top text-problem">{row.reason}</TableCell>
                    <TableCell className="max-w-[48ch] align-top text-ink-muted">{row.text}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {preview.invalid.length > VISIBLE_INVALID && (
              <p className="mt-4 text-base text-ink-muted">
                {t("moreInvalid", { n: formatNumber(preview.invalid.length - VISIBLE_INVALID, locale) })}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button disabled={preview.newCount === 0 || pending} onClick={save}>
            {pending ? t("importing") : t("import", { count: preview.newCount, n: formatNumber(preview.newCount, locale) })}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
            {t("chooseAnother")}
          </Button>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </div>
    )

  return (
    <div className="flex flex-col items-start gap-4">
      {picker}
      <p className="max-w-[62ch] text-base leading-normal text-ink-muted [&_b]:text-ink">
        {t.rich("intro", { b: (chunks) => <b>{chunks}</b>, max: formatNumber(CSV_MAX_ROWS, locale) })}
      </p>
      <Button variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? t("reading", { name: file?.name ?? t("defaultFileName") }) : t("chooseFile")}
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

function formDataOf(file: File) {
  const data = new FormData()
  data.set("file", file)
  return data
}

// ". Left out: 3 already there, 2 invalid rows and 40 over the plan limit."
function ignoredSummary(
  t: ReturnType<typeof useTranslations>,
  locale: Locale,
  duplicates: number,
  invalid: number,
  overLimit: number
) {
  const parts = [
    duplicates > 0 && t("ignoredDuplicates", { count: duplicates, n: formatNumber(duplicates, locale) }),
    invalid > 0 && t("ignoredInvalid", { count: invalid, n: formatNumber(invalid, locale) }),
    overLimit > 0 && t("ignoredOverLimit", { n: formatNumber(overLimit, locale) }),
  ].filter((p): p is string => Boolean(p))
  if (parts.length === 0) return "."
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")}${t("ignoredAnd")}${parts.at(-1)}`
  return `${t("ignoredPrefix")}${list}.`
}
