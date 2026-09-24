import type { Priority, ThemeKind, ThemeStatus } from "./types";

export const KIND_LABELS: Record<ThemeKind, string> = {
  problem: "Problema",
  opportunity: "Opportunità",
  praise: "Apprezzamento",
};

export const KIND_PLURALS: Record<ThemeKind, string> = {
  problem: "Problemi",
  opportunity: "Opportunità",
  praise: "Apprezzamenti",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

export const STATUS_LABELS: Record<ThemeStatus, string> = {
  to_review: "Da valutare",
  roadmap: "In roadmap",
  done: "Fatto",
  discarded: "Scartato",
};

const dayMonth = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("it-IT", { month: "long", timeZone: "Europe/Rome" });
const monthKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Rome" });
const number = new Intl.NumberFormat("it-IT", { useGrouping: "always" });

// "2026-09-18" → "18 settembre"
export function formatDate(isoDate: string) {
  return dayMonth.format(new Date(isoDate));
}

export function formatMonth(date: Date) {
  return monthName.format(date);
}

// Quotas reset on the Italian calendar month: "2026-09"
export function monthOf(date: Date) {
  return monthKey.format(date);
}

// 2000 → "2.000"
export function formatNumber(n: number) {
  return number.format(n);
}

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });

// The day on the Italian calendar, like received_at: "2026-09-25"
export function isoDateOf(date: Date) {
  return isoDay.format(date);
}
