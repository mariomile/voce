"use client"

import Link from "next/link"
import { useRef, useState, useTransition } from "react"
import { importCsv, previewCsv, type CsvImportResult, type CsvPreview } from "@/app/(app)/collect/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardText, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatNumber } from "@/lib/format"
import { CSV_MAX_BYTES, CSV_MAX_ROWS } from "@/lib/plans"

const VISIBLE_INVALID = 50

// Pick a file → the server reads it and says what would happen → import. Nothing is saved before.
export function CsvImport() {
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
      setError("Il file supera 1 MB. Dividilo in più file e importali uno alla volta.")
      return
    }
    setFile(chosen)
    startTransition(async () => {
      const response = await previewCsv(formDataOf(chosen))
      if (response.ok) setPreview(response)
      else setError(response.error)
    })
  }

  function save() {
    if (!file) return
    startTransition(async () => {
      const response = await importCsv(formDataOf(file))
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
          <b>
            {result.imported === 1 ? "Importato 1 feedback" : `Importati ${formatNumber(result.imported)} feedback`}
          </b>
          {ignoredSummary(result.duplicateCount, result.invalidCount, result.overLimitCount)}
        </p>
        <div className="flex gap-3">
          <Link href="/feedback" className={buttonVariants()}>
            Vedi i feedback
          </Link>
          <Button variant="secondary" onClick={() => input.current?.click()}>
            Importa un altro file
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
            <b>
              {preview.newCount === 1
                ? "1 feedback da importare"
                : `${formatNumber(preview.newCount)} feedback da importare`}
            </b>
            {ignoredSummary(preview.duplicateCount, preview.invalid.length, preview.overLimitCount)}
          </p>
        </div>

        {preview.overLimitCount > 0 && (
          <Card variant="soft">
            <CardTitle>Il piano Free arriva a 100 feedback</CardTitle>
            <CardText className="mb-0">
              {preview.newCount === 0
                ? preview.overLimitCount === 1
                  ? "Non c'è più posto: il feedback nuovo resta fuori."
                  : `Non c'è più posto: ${formatNumber(preview.overLimitCount)} feedback nuovi restano fuori.`
                : `Importiamo le prime ${formatNumber(preview.newCount)} righe valide, le altre ${formatNumber(preview.overLimitCount)} restano fuori.`}{" "}
              Con Pro i feedback sono illimitati.
            </CardText>
          </Card>
        )}

        {preview.sample.length > 0 && (
          <div>
            <h3 className="mb-2 text-xl font-bold">
              {preview.sample.length < preview.newCount ? "Le prime righe" : "Le righe"}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Canale</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.sample.map((row) => (
                  <TableRow key={row.line}>
                    <TableCell className="max-w-[64ch]">{row.text}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink-muted">{row.channel}</TableCell>
                    <TableCell className="whitespace-nowrap text-ink-muted">{row.customer}</TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {row.receivedAt ? formatDate(row.receivedAt) : "oggi"}
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
              {preview.invalid.length === 1
                ? "1 riga non valida"
                : `${formatNumber(preview.invalid.length)} righe non valide`}
            </h3>
            <p className="mb-2 text-base text-ink-muted">
              Non vengono importate. Correggile nel file e caricalo di nuovo: le righe già importate
              non si duplicano.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Riga</TableHead>
                  <TableHead>Problema</TableHead>
                  <TableHead>Testo</TableHead>
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
                E altre {formatNumber(preview.invalid.length - VISIBLE_INVALID)} righe non valide.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button disabled={preview.newCount === 0 || pending} onClick={save}>
            {pending
              ? "Importo…"
              : preview.newCount === 1
                ? "Importa 1 feedback"
                : `Importa ${formatNumber(preview.newCount)} feedback`}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
            Scegli un altro file
          </Button>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </div>
    )

  return (
    <div className="flex flex-col items-start gap-4">
      {picker}
      <p className="max-w-[62ch] text-base leading-normal text-ink-muted [&_b]:text-ink">
        Serve una colonna <b>testo</b>. Canale, cliente e data sono facoltativi. Fino a{" "}
        {formatNumber(CSV_MAX_ROWS)} righe e 1 MB. Prima di salvare vedi cosa entra e quali righe non
        vanno; i feedback già presenti non si duplicano.
      </p>
      <Button variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
        {pending ? `Leggo ${file?.name ?? "il file"}…` : "Scegli il file"}
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

// ". Restano fuori: 3 già presenti, 2 righe non valide e 40 oltre il limite del piano."
function ignoredSummary(duplicates: number, invalid: number, overLimit: number) {
  const parts = [
    duplicates > 0 && `${formatNumber(duplicates)} già ${duplicates === 1 ? "presente" : "presenti"}`,
    invalid > 0 && (invalid === 1 ? "1 riga non valida" : `${formatNumber(invalid)} righe non valide`),
    overLimit > 0 && `${formatNumber(overLimit)} oltre il limite del piano`,
  ].filter((p): p is string => Boolean(p))
  if (parts.length === 0) return "."
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}`
  return `. Restano fuori: ${list}.`
}
