import { describe, expect, it } from "vitest"
import { CSV_DEFAULT_CHANNEL, parseDate, parseFeedbackCsv } from "./csv-import"

const TODAY = "2026-09-25"
const utf8 = (text: string) => new TextEncoder().encode(text)
const parse = (text: string) => parseFeedbackCsv(utf8(text), TODAY)

describe("parseFeedbackCsv", () => {
  it("reads a clean file with every column", () => {
    expect(parse("testo,canale,cliente,data\nLa banca si scollega,Supporto,Rossi Srl,2026-09-01\n")).toEqual({
      ok: true,
      rows: [{ line: 2, text: "La banca si scollega", channel: "Supporto", customer: "Rossi Srl", receivedAt: "2026-09-01" }],
      invalid: [],
    })
  })

  it("needs only the testo column, and fills the channel", () => {
    const result = parse("testo\nPrimo\nSecondo")
    expect(result).toMatchObject({ ok: true, invalid: [] })
    if (!result.ok) return
    expect(result.rows.map((r) => [r.text, r.channel, r.customer, r.receivedAt])).toEqual([
      ["Primo", CSV_DEFAULT_CHANNEL, null, null],
      ["Secondo", CSV_DEFAULT_CHANNEL, null, null],
    ])
  })

  it("reads Excel files: BOM, semicolons, CRLF, headers in any case and order, extra columns", () => {
    const file = "﻿ID;Data;TESTO ; Canale;Note\r\n1;01/09/2026;Non trovo l'export, serve in CSV;Email;x\r\n"
    expect(parse(file)).toEqual({
      ok: true,
      rows: [{ line: 2, text: "Non trovo l'export, serve in CSV", channel: "Email", customer: null, receivedAt: "2026-09-01" }],
      invalid: [],
    })
  })

  it("reads short Excel files with semicolons or tabs, commas unquoted", () => {
    for (const d of [";", "\t"]) {
      const result = parse(`testo${d}canale\r\nLento, caro${d}Email\r\n\r\nBello${d}Slack\r\n`)
      expect(result).toMatchObject({ ok: true, invalid: [] })
      if (result.ok) expect(result.rows.map((r) => [r.text, r.channel])).toEqual([["Lento, caro", "Email"], ["Bello", "Slack"]])
    }
  })

  it("does not split a single-column file on commas", () => {
    const result = parse("testo\r\nLento, caro, e confuso\r\nBello; davvero\r\n")
    expect(result).toMatchObject({ ok: true, invalid: [] })
    if (result.ok) expect(result.rows.map((r) => r.text)).toEqual(["Lento, caro, e confuso", "Bello; davvero"])
  })

  it("drops NUL characters instead of failing later in the database", () => {
    expect(parse("testo\nCi\u0000ao")).toMatchObject({ ok: true, rows: [{ text: "Ciao" }] })
  })

  it("reads Windows-1252 files from Excel", () => {
    // "Perché è lento" in Windows-1252: é = 0xE9, è = 0xE8
    const bytes = new Uint8Array([...utf8("testo\nPerch"), 0xe9, ...utf8(" "), 0xe8, ...utf8(" lento\n")])
    expect(parseFeedbackCsv(bytes, TODAY)).toMatchObject({ ok: true, rows: [{ text: "Perché è lento" }] })
  })

  it("keeps quoted commas, quotes and line breaks inside a feedback", () => {
    const file = 'testo,canale\n"Lento, molto lento",Supporto\n"Dice ""mai più""\nsu due righe",Slack\nUltimo,Email'
    const result = parse(file)
    expect(result).toMatchObject({ ok: true, invalid: [] })
    if (!result.ok) return
    expect(result.rows.map((r) => [r.line, r.text])).toEqual([
      [2, "Lento, molto lento"],
      [3, 'Dice "mai più"\nsu due righe'],
      [4, "Ultimo"],
    ])
  })

  it("skips blank lines but keeps Excel row numbers", () => {
    const result = parse("testo,canale\n\nPrimo,Supporto\n , \n\nSecondo,Email\n\n")
    expect(result).toMatchObject({ ok: true, invalid: [] })
    if (!result.ok) return
    expect(result.rows.map((r) => [r.line, r.text])).toEqual([
      [3, "Primo"],
      [6, "Secondo"],
    ])
  })

  it("flags invalid rows with their row number and reason, and keeps the rest", () => {
    const long = "a".repeat(2001)
    const file = [
      "testo,canale,cliente,data",
      "Buono,Supporto,,",
      ",Supporto,Rossi,2026-09-01",
      `${long},Supporto,,`,
      `Canale lungo,${"c".repeat(61)},,`,
      `Cliente lungo,Supporto,${"c".repeat(201)},`,
      "Data sbagliata,Supporto,,31/02/2026",
      "Data nel futuro,Supporto,,2026-12-01",
      "Data strana,Supporto,,ieri",
      "Una virgola, fuori dalle virgolette,Supporto,,2026-09-01,extra",
      "Anche questo è buono,Supporto,Bianchi,2026-09-24",
    ].join("\n")
    const result = parse(file)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows.map((r) => r.line)).toEqual([2, 11])
    expect(result.invalid.map((r) => [r.line, r.reason])).toEqual([
      [3, "Il testo è vuoto."],
      [4, "Il testo ha 2.001 caratteri, il massimo è 2.000."],
      [5, "Il canale supera 60 caratteri."],
      [6, "Il cliente supera 200 caratteri."],
      [7, 'La data "31/02/2026" non è valida. Usa 25/09/2026 o 2026-09-25.'],
      [8, "La data 1/12/2026 è nel futuro."],
      [9, 'La data "ieri" non è valida. Usa 25/09/2026 o 2026-09-25.'],
      [10, "La riga ha più colonne dell'intestazione: forse c'è una virgola nel testo senza virgolette."],
    ])
    // The text shown next to the reason is cut, so the preview stays readable.
    expect(result.invalid[1].text).toHaveLength(120)
    expect(result.invalid[0].text).toBe(",Supporto,Rossi,2026-09-01".split(",").join(" ").trim())
  })

  it("accepts empty trailing cells after the last column", () => {
    expect(parse("testo,canale\nCiao,Supporto,,\n")).toMatchObject({ ok: true, rows: [{ text: "Ciao" }], invalid: [] })
  })

  it("flags an unclosed quote instead of silently merging rows", () => {
    const result = parse('testo,canale\nPrimo,Supporto\n"Non chiuso,Supporto\nTerzo,Email')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rows.map((r) => r.text)).toEqual(["Primo"])
    expect(result.invalid).toHaveLength(1)
    expect(result.invalid[0]).toMatchObject({ line: 3 })
    expect(result.invalid[0].reason).toMatch(/virgolette/)
  })

  it("rejects files without a testo column, empty files, header-only files", () => {
    expect(parse("feedback,data\nCiao,2026-09-01")).toEqual({
      ok: false,
      error: "Manca la colonna testo. Colonne trovate: feedback, data.",
    })
    expect(parseFeedbackCsv(new Uint8Array(), TODAY)).toEqual({ ok: false, error: "Il file è vuoto." })
    expect(parse("\n\n")).toEqual({ ok: false, error: "Manca la colonna testo nella prima riga del file." })
    expect(parse("testo,canale\n\n")).toEqual({ ok: false, error: "Il file ha solo l'intestazione, nessun feedback." })
  })

  it("rejects more than 2,000 rows and more than 1 MB", () => {
    const rows = (n: number) => ["testo", ...Array.from({ length: n }, (_, i) => `Feedback ${i}`)].join("\n")
    expect(parse(rows(2000))).toMatchObject({ ok: true })
    expect(parse(rows(2001))).toEqual({
      ok: false,
      error: "Il file ha 2.001 righe, il massimo è 2.000. Dividilo in più file.",
    })
    expect(parse(`testo\n${"a".repeat(1024 * 1024)}`)).toEqual({
      ok: false,
      error: "Il file supera 1 MB. Dividilo in più file e importali uno alla volta.",
    })
  })
})

describe("parseDate", () => {
  it.each([
    ["2026-09-01", "2026-09-01"],
    ["2026-9-1", "2026-09-01"],
    ["01/09/2026", "2026-09-01"],
    ["1-9-2026", "2026-09-01"],
    ["01.09.2026", "2026-09-01"],
    ["2026-09-01T10:30:00Z", "2026-09-01"],
    ["01/09/2026 10:30", "2026-09-01"],
    ["2024-02-29", "2024-02-29"],
    ["2026-09-25", "2026-09-25"],
    ["", null],
  ])("%s → %s", (value, expected) => {
    expect(parseDate(value, TODAY)).toEqual(expected)
  })

  it.each(["2025-02-29", "13/13/2026", "09/01/26", "1999-12-31", "settembre", "2026/09/01"])(
    "%s is not valid",
    (value) => {
      expect(parseDate(value, TODAY)).toHaveProperty("error")
    }
  )

  it("refuses tomorrow", () => {
    expect(parseDate("2026-09-26", TODAY)).toEqual({ error: "La data 26/9/2026 è nel futuro." })
  })
})
