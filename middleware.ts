/**
 * middleware.ts — Project root
 * MYOP Healthcare Marketplace
 * Updated — / and /hospitals/* and /book/* are public (no auth required)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitRoute, applySecurityHeaders, securityLogger } from '@/lib/security'

const AUTH_RATE_LIMITED_PATHS: Record<string, 'auth:login' | 'auth:signup'> = {
  '/auth/login':  'auth:login',
  '/auth/signup': 'auth:signup',
}

// Routes that are fully public — no auth check, no redirect
const PUBLIC_PREFIXES = [
  '/',
  '/hospitals',
  '/book',
  '/register',
  '/coming-soon',
  '/auth',
  '/api',
]

function isPublicPath(pathname: string): boolean {
  // Exact match for root
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some(prefix =>
    prefix !== '/' && pathname.startsWith(prefix)
  )
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // ── 1. Rate limit auth endpoints ──
  const rateLimitKey = AUTH_RATE_LIMITED_PATHS[pathname]
  if (rateLimitKey && request.method === 'POST') {
    const limitResponse = rateLimitRoute(request, rateLimitKey)
    if (limitResponse) {
      securityLogger.rateLimitHit(
        request.headers.get('x-forwarded-for') ?? '127.0.0.1',
        pathname,
      )
      applySecurityHeaders(limitResponse.headers)
      return limitResponse
    }
  }

  // ── 2. Session refresh (always run — keeps auth cookie fresh) ──
  let response: NextResponse

    if (isPublicPath(pathname)) {
      response = NextResponse.next()
    } else {
      response = await updateSession(request)
    }
  // ── 3. Security headers ──
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/hospital/') ||
    pathname.startsWith('/admin')

  applySecurityHeaders(response.headers, { noCache: isProtectedRoute })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|mp4)$).*)',
  ],
}