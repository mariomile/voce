import type { ReactNode } from "react"
import { createFormatter, createTranslator } from "use-intl/core"
import { messages } from "@/i18n/messages/index"

// Stands in for next-intl in the unit tests (see vitest.config.mts): the components render outside
// Next, with no request and no provider. Same Italian catalog, same ICU formatter: the tests keep
// reading the real Italian texts.
export const TEST_LOCALE = "it" as const
const timeZone = "Europe/Rome"

export const translator = (namespace?: string) =>
  createTranslator({ locale: TEST_LOCALE, timeZone, messages: messages.it, namespace: namespace as never })
export const formatter = () => createFormatter({ locale: TEST_LOCALE, timeZone })

export const useTranslations = translator
export const useLocale = () => TEST_LOCALE
export const useFormatter = formatter
export const NextIntlClientProvider = ({ children }: { children: ReactNode }) => children
