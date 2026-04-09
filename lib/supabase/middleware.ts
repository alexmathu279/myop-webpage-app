/**
 * lib/supabase/middleware.ts
 * MYOP Healthcare Marketplace
 *
 * All redirects use: new URL(path, request.nextUrl)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import type { UserRole } from '@/types/domain'

const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/bookings',
  '/profile',
  '/payments',
  '/hospital/',              // ← trailing slash — must NOT match /hospitals
  '/admin',
  '/book/confirm',           // ← covers /book/confirm and /book/confirm/diagnostic
] as const

const AUTH_ROUTE_PREFIXES = ['/auth'] as const

const ONBOARDING_ALLOWED = [
  '/auth/onboarding',
  '/auth/callback',
  '/auth/error',
] as const

const ROLE_DASHBOARD: Record<UserRole, string> = {
  patient:        '/dashboard',
  hospital_staff: '/hospital/dashboard',
  admin:          '/admin/dashboard',
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Unauthenticated → protected route ──
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.nextUrl)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Authenticated → auth route ──
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )
  const isOnboardingAllowed = ONBOARDING_ALLOWED.some((p) =>
    pathname.startsWith(p),
  )

  if (isAuthRoute && !isOnboardingAllowed && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_onboarded')
      .eq('id', user.id)
      .single<{ role: UserRole; is_onboarded: boolean }>()

    const role = profile?.role ?? 'patient'

    if (role === 'patient' && profile?.is_onboarded === false) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.nextUrl))
    }

    return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], request.nextUrl))
  }

  // ── Onboarding guard ──
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_onboarded')
      .eq('id', user.id)
      .single<{ role: UserRole; is_onboarded: boolean }>()

    if (profile?.role === 'patient' && profile?.is_onboarded === false) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.nextUrl))
    }
  }

  // ── Admin only ──
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARD[(profile?.role as UserRole) ?? 'patient'], request.nextUrl)
      )
    }
  }

  // ── Staff or admin only ──
  if (user && pathname.startsWith('/hospital')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>()

    if (profile?.role !== 'hospital_staff' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD['patient'], request.nextUrl))
    }
  }

  return supabaseResponse
}