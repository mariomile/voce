"use client"

import { cn } from "cn"
import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"
import { setLocale } from "@/i18n/actions"
import { LOCALES } from "@/i18n/locale"

// IT · EN. Inherits the text color, so it works on paper, ink and yellow. The cookie set by the
// action re-renders the page from the server in the new language.
export function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations("common.localeSwitch")
  const current = useLocale()
  const [pending, startTransition] = useTransition()
  return (
    <div role="group" aria-label={t("label")} className={cn("flex items-center gap-1 font-semibold", className)}>
      {LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className="opacity-40">·</span>}
          <button
            type="button"
            lang={locale}
            aria-label={t(locale)}
            aria-pressed={locale === current}
            disabled={pending}
            onClick={() => startTransition(() => setLocale(locale))}
            // On a touch screen the tap area grows to 44 px tall and a little wider, without moving the letters.
            className="relative cursor-pointer uppercase underline-offset-4 opacity-60 hover:underline aria-pressed:underline aria-pressed:decoration-2 aria-pressed:opacity-100 disabled:cursor-wait pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1.5 pointer-coarse:after:-inset-y-3"
          >
            {locale}
          </button>
        </span>
      ))}
    </div>
  )
}
