import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { LOCALE_COOKIE, resolveLocale } from "./locale"
import { messages } from "./messages/index"

// The language is decided per request, never by the URL: links, the form QR code, auth callbacks
// and Stripe return URLs stay the same in every language.
export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  })
  return { locale, messages: messages[locale], timeZone: "Europe/Rome" }
})
