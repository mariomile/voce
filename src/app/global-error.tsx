"use client"

import { useSyncExternalStore } from "react"
import { ErrorView } from "@/components/error-view"
import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/i18n/locale"
import en from "@/i18n/messages/en/common.json"
import it from "@/i18n/messages/it/common.json"
import "./globals.css"

const TEXTS = { it: it.error, en: en.error }

// The language as the root layout decides it (the IT/EN switch, then the browser), read in the browser:
// here the root layout itself broke. Italian on the server and until the page is live.
const noSubscription = () => () => {}
function browserLocale(): Locale {
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1)
  return resolveLocale({ cookie, acceptLanguage: navigator.languages.join(",") })
}

// When the root layout breaks: its own document, with the same page as error.tsx.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; reset: () => void; retry: () => void }) {
  const locale = useSyncExternalStore(noSubscription, browserLocale, (): Locale => "it")
  return (
    <html lang={locale} className="h-full">
      <body className="flex min-h-full flex-col">
        <title>Voce</title>
        <ErrorView t={TEXTS[locale]} onRetry={retry} />
      </body>
    </html>
  )
}
