export const LOCALES = ["it", "en"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "it"
// Written by the IT/EN switch. The name next-intl uses by default.
export const LOCALE_COOKIE = "NEXT_LOCALE"

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

// The first supported language in the browser's order of preference: "fr-FR,en;q=0.5" → "en".
export function localeFromAcceptLanguage(header: string | null): Locale | undefined {
  const languages = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";")
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="))
      return { language: tag.split("-")[0].toLowerCase(), q: q ? Number(q.slice(2)) : 1, index }
    })
    .filter((l) => l.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
  return languages.map((l) => l.language).find(isLocale)
}

// The switch wins, then the browser, then Italian.
export function resolveLocale({ cookie, acceptLanguage }: { cookie: string | undefined; acceptLanguage: string | null }) {
  if (isLocale(cookie)) return cookie
  return localeFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE
}

// Pages whose language does not follow the visitor. The public form speaks Italian: workspaces have
// no language of their own yet, and the form must read the same for everyone who scans the QR code.
export const PUBLIC_FORM_LOCALE: Locale = DEFAULT_LOCALE

export function pinnedLocale(pathname: string): Locale | undefined {
  return pathname.startsWith("/f/") ? PUBLIC_FORM_LOCALE : undefined
}
