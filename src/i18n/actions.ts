"use server"

import { cookies } from "next/headers"
import { z } from "zod"
import { LOCALE_COOKIE, LOCALES } from "./locale"

const localeSchema = z.enum(LOCALES)

// The IT/EN switch. The page re-renders from the server with the new language.
export async function setLocale(input: z.input<typeof localeSchema>) {
  const parsed = localeSchema.safeParse(input)
  if (!parsed.success) return
  ;(await cookies()).set(LOCALE_COOKIE, parsed.data, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}
