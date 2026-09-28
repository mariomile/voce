import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { LOCALE_COOKIE, pinnedLocale } from "@/i18n/locale"

const APP_PATHS = ["/research", "/ask", "/billing"]
const AUTH_PATHS = ["/login", "/signup"]

// Refreshes the Supabase session on every request and keeps signed-out users out of the app.
// Pages still read data under RLS: this is a redirect, not the security boundary.
export async function proxy(request: NextRequest) {
  // Some pages have a fixed language (the public form: Italian). Set here, before anything renders,
  // it covers the page, its metadata, the root layout and the form's server action alike.
  const pinned = pinnedLocale(request.nextUrl.pathname)
  if (pinned) request.cookies.set(LOCALE_COOKIE, pinned)
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const path = request.nextUrl.pathname
  const inApp = APP_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

  // The question action and the one creating a Research answer "session" themselves, so the page can
  // say so and keep the text. Only a POST is ever a server action call: a GET carrying the same header
  // is a page load, and a forged header must not skip the redirect and reach the page's own queries
  // without a session.
  const answersSession = ["/ask", "/research", "/research/new"].includes(path)
  const sessionAction = answersSession && request.method === "POST" && request.headers.has("next-action")
  if (inApp && !signedIn && !sessionAction) return redirectKeepingSession(request, response, "/login")
  if (AUTH_PATHS.includes(path) && signedIn) return redirectKeepingSession(request, response, "/research")
  return response
}

function redirectKeepingSession(request: NextRequest, from: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url))
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header)
    if (value) redirect.headers.set(header, value)
  }
  return redirect
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
