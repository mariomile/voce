import type { Locale } from "@/i18n/locale";

// Dates and numbers in the language of the interface. Quotas and received_at stay on the Italian
// calendar (Europe/Rome) in every language.
const INTL_LOCALES: Record<Locale, string> = { it: "it-IT", en: "en-US" };

function formatters(locale: Locale) {
  const tag = INTL_LOCALES[locale];
  return {
    dayMonth: new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", timeZone: "UTC" }),
    monthName: new Intl.DateTimeFormat(tag, { month: "long", timeZone: "Europe/Rome" }),
    number: new Intl.NumberFormat(tag, { useGrouping: "always" }),
  };
}

const byLocale = { it: formatters("it"), en: formatters("en") } satisfies Record<Locale, unknown>;

const monthKey = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Rome" });

// "2026-09-18" → "18 settembre", "September 18"
export function formatDate(isoDate: string, locale: Locale) {
  return byLocale[locale].dayMonth.format(new Date(isoDate));
}

export function formatMonth(date: Date, locale: Locale) {
  return byLocale[locale].monthName.format(date);
}

// Quotas reset on the Italian calendar month: "2026-09"
export function monthOf(date: Date) {
  return monthKey.format(date);
}

// 2000 → "2.000", "2,000"
export function formatNumber(n: number, locale: Locale) {
  return byLocale[locale].number.format(n);
}

const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });

// The day on the Italian calendar, like received_at: "2026-09-25"
export function isoDateOf(date: Date) {
  return isoDay.format(date);
}
