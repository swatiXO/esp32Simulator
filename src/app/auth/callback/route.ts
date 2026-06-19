import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin

  if (code) {
    // Build the redirect response first so we can attach cookies to it
    const redirectUrl = new URL(next, siteUrl)
    const response = NextResponse.redirect(redirectUrl)

    // Create a Supabase client that reads cookies from the request
    // and writes session cookies directly onto the redirect response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Code missing or exchange failed
  const errorUrl = new URL('/login?message=Could+not+authenticate+user', siteUrl)
  return NextResponse.redirect(errorUrl)
}
