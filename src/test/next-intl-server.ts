import { TEST_LOCALE, formatter, translator } from "./next-intl"

// Server half of the next-intl stand-in: see next-intl.tsx.
export async function getTranslations(options?: string | { namespace?: string }) {
  return translator(typeof options === "string" ? options : options?.namespace)
}
export const getLocale = async () => TEST_LOCALE
export const getFormatter = async () => formatter()
