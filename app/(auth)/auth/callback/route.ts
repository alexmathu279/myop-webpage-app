/**
 * app/(auth)/auth/callback/route.ts
 * FIX: reads booking_redirect from user metadata after email confirm
 *      and passes it to /auth/onboarding as ?redirectTo= so it survives
 *      the full signup → confirm email → onboarding → slot page flow.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/domain'

const ROLE_DASHBOARD: Record<UserRole, string> = {
  patient:        '/dashboard',
  hospital_staff: '/hospital/dashboard',
  admin:          '/admin/dashboard',
}

/** Safety check — only allow relative paths, prevents open redirect */
function isSafeRedirect(url: string | null | undefined): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//')
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)

  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type')

  const supabase = await createClient()

  // --- Token hash flow (email confirm) ---
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type ?? 'signup') as any,
    })
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/error?reason=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  }

  // --- Code flow (OAuth / magic link) ---
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/error?reason=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  }

  else {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_code', request.url))
  }

  // --- Route based on profile state ---
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_onboarded')
    .eq('id', user.id)
    .single<{ role: UserRole; is_onboarded: boolean }>()

  if (!profile) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Staff/admin who haven't completed invite setup
  if (profile.role !== 'patient' && !profile.is_onboarded) {
    return NextResponse.redirect(new URL('/auth/invite/accept', request.url))
  }

  // Patient who hasn't onboarded yet
  if (profile.role === 'patient' && !profile.is_onboarded) {
    // FIX: read booking_redirect from user metadata (stored during signUp)
    // and pass it to the onboarding page so it can redirect back after setup
    const bookingRedirect = user.user_metadata?.booking_redirect as string | null

    if (isSafeRedirect(bookingRedirect)) {
      return NextResponse.redirect(
        new URL(`/auth/onboarding?redirectTo=${encodeURIComponent(bookingRedirect)}`, request.url)
      )
    }

    return NextResponse.redirect(new URL('/auth/onboarding', request.url))
  }

  // Already onboarded — go to dashboard
  return NextResponse.redirect(new URL(ROLE_DASHBOARD[profile.role], request.url))
}