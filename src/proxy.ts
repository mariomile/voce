import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const APP_PATHS = ["/themes", "/feedback", "/collect", "/billing"]
const AUTH_PATHS = ["/login", "/signup"]

// Refreshes the Supabase session on every request and keeps signed-out users out of the app.
// Pages still read data under RLS: this is a redirect, not the security boundary.
export async function proxy(request: NextRequest) {
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

  if (inApp && !signedIn) return redirectKeepingSession(request, response, "/login")
  if (AUTH_PATHS.includes(path) && signedIn) return redirectKeepingSession(request, response, "/themes")
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
