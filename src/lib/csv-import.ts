import type { useTranslations } from "next-intl";
import Papa from "papaparse";

import type { Locale } from "@/i18n/locale";
import { formatNumber } from "./format";
import {
  CHANNEL_MAX_LENGTH,
  CSV_MAX_BYTES,
  CSV_MAX_ROWS,
  CUSTOMER_MAX_LENGTH,
  FEEDBACK_MAX_LENGTH,
} from "./plans";

// Reads a feedback CSV as people export it: from Excel (semicolons, Windows-1252), Google Sheets,
// support tools. Column `testo` is required; `canale`, `cliente`, `data` are optional.

// Error and status strings read from the "collect.csvImport" catalog: it carries the Italian source
// and the English translation.
export type CsvImportT = ReturnType<typeof useTranslations<"collect">>;

export const CSV_DEFAULT_CHANNEL = "Importazione CSV";

export type CsvRow = {
  // Row number as Excel shows it: the header is row 1.
  line: number;
  text: string;
  channel: string;
  customer: string | null;
  receivedAt: string | null;
};

export type CsvInvalidRow = { line: number; text: string; reason: string };

export type ParsedCsv =
  | { ok: true; rows: CsvRow[]; invalid: CsvInvalidRow[] }
  | { ok: false; error: string };

const SNIPPET_LENGTH = 120;

// UTF-8 first; a file that is not valid UTF-8 almost always comes from Excel on Windows.
export function decodeCsv(bytes: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export function parseFeedbackCsv(bytes: Uint8Array, today: string, t: CsvImportT, locale: Locale): ParsedCsv {
  if (bytes.byteLength === 0) return { ok: false, error: t("csvImport.emptyFile") };
  if (bytes.byteLength > CSV_MAX_BYTES) return { ok: false, error: t("csvImport.sizeError") };

  // Postgres text cannot hold NUL characters.
  const content = decodeCsv(bytes).replace(/^\uFEFF/, "").replaceAll("\0", "");
  // Blank lines stay in the result, so row numbers match what Excel shows.
  const { data, errors } = Papa.parse<string[]>(content, { skipEmptyLines: false, delimiter: delimiterOf(content) });
  const brokenQuotes = new Set(errors.flatMap((e) => (e.type === "Quotes" && e.row !== undefined ? [e.row] : [])));

  const records = data.map((fields, i) => ({ fields, line: i + 1 }));
  const header = records.shift();
  const columns = header?.fields.map((name) => name.trim().toLowerCase()) ?? [];
  const col = (name: string) => columns.indexOf(name);
  if (col("testo") === -1) {
    const found = columns.filter(Boolean);
    return {
      ok: false,
      error: found.length
        ? t("csvImport.missingColumnFound", { columns: found.join(", ") })
        : t("csvImport.missingColumnNone"),
    };
  }

  const filled = records.filter((r) => r.fields.some((f) => f.trim() !== ""));
  if (filled.length === 0) return { ok: false, error: t("csvImport.onlyHeader") };
  if (filled.length > CSV_MAX_ROWS)
    return {
      ok: false,
      error: t("csvImport.tooManyRows", {
        rows: formatNumber(filled.length, locale),
        max: formatNumber(CSV_MAX_ROWS, locale),
      }),
    };

  const rows: CsvRow[] = [];
  const invalid: CsvInvalidRow[] = [];
  for (const { fields, line } of filled) {
    const get = (name: string) => (col(name) === -1 ? "" : (fields[col(name)] ?? "").trim());
    const text = get("testo").replace(/\r\n?/g, "\n");
    const reason = rowError(fields, columns.length, line - 1, brokenQuotes, t);
    const date = parseDate(get("data"), today, t);
    const problem =
      reason ??
      (!text
        ? t("csvImport.emptyText")
        : text.length > FEEDBACK_MAX_LENGTH
          ? t("csvImport.textTooLong", {
              length: formatNumber(text.length, locale),
              max: formatNumber(FEEDBACK_MAX_LENGTH, locale),
            })
          : get("canale").length > CHANNEL_MAX_LENGTH
            ? t("csvImport.channelTooLong", { max: CHANNEL_MAX_LENGTH })
            : get("cliente").length > CUSTOMER_MAX_LENGTH
              ? t("csvImport.customerTooLong", { max: CUSTOMER_MAX_LENGTH })
              : date !== null && typeof date === "object"
                ? date.error
                : null);
    if (problem) {
      invalid.push({ line, text: snippet(text || fields.join(" ").trim()), reason: problem });
      continue;
    }
    rows.push({
      line,
      text,
      channel: get("canale") || CSV_DEFAULT_CHANNEL,
      customer: get("cliente") || null,
      receivedAt: typeof date === "string" ? date : null,
    });
  }
  return { ok: true, rows, invalid };
}

// The separator the header uses. Papa's own guess falls back to a comma on short files, and Italian
// Excel writes semicolons without quoting commas. A single-column file is not split at all.
function delimiterOf(content: string) {
  const header = content.split(/\r?\n/, 1)[0];
  const counts = [";", "\t", ","].map((d) => ({ d, n: header.split(d).length - 1 }));
  const best = counts.reduce((a, b) => (b.n > a.n ? b : a));
  return best.n > 0 ? best.d : "\u001f";
}

function rowError(fields: string[], columnCount: number, recordIndex: number, brokenQuotes: Set<number>, t: CsvImportT) {
  if (brokenQuotes.has(recordIndex)) return t("csvImport.brokenQuotes");
  // Extra empty cells are harmless (trailing separators); extra text usually means a comma outside quotes.
  if (fields.slice(columnCount).some((f) => f.trim() !== "")) return t("csvImport.extraColumns");
  return null;
}

// "2026-09-01", "01/09/2026", "1-9-2026", "01.09.2026", also followed by a time.
// Returns the ISO date, null when empty, or the reason it is not valid.
export function parseDate(value: string, today: string, t: CsvImportT): string | null | { error: string } {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  const italian = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s.*)?$/);
  const parts = iso ? [iso[1], iso[2], iso[3]] : italian ? [italian[3], italian[2], italian[1]] : null;
  const invalid = { error: t("csvImport.invalidDate", { value: snippet(value, 30) }) };
  if (!parts) return invalid;
  const [year, month, day] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 2000 || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return invalid;
  const result = date.toISOString().slice(0, 10);
  if (result > today) return { error: t("csvImport.futureDate", { date: `${day}/${month}/${year}` }) };
  return result;
}

function snippet(text: string, length = SNIPPET_LENGTH) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
