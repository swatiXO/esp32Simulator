import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Exchanges an OAuth authorization code for a Supabase session and redirects the user.
 *
 * Extracts the OAuth code and optional redirect path from query parameters. Exchanges the code for a session. On success, redirects to the specified path (defaults to `/dashboard`) using environment-specific redirect logic that accounts for load balancers. On failure, redirects to the login page with an error message.
 *
 * @returns A redirect response to either the authenticated user's destination or the login page with an error message.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        const isLocalHost = forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1')
        const protocol = isLocalHost ? 'http' : 'https'
        return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`)
}
