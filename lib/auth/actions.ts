'use server'

/**
 * lib/auth/actions.ts
 * MYOP Healthcare Marketplace — Auth Server Actions
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  validateForm,
  SignUpSchema,
  SignInSchema,
  AcceptInviteSchema,
  OnboardingSchema,
  InviteStaffSchema,
  rateLimitAction,
  securityLogger,
} from '@/lib/security'
import type { UserRole } from '@/types/domain'
import type { ActionResult } from '@/types/dto'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_DASHBOARD: Record<UserRole, string> = {
  patient:        '/dashboard',
  hospital_staff: '/hospital/dashboard',
  admin:          '/admin/dashboard',
}

async function getIp(): Promise<string> {
  const { headers } = await import('next/headers')
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
}

/** Safety check — only allow relative paths, prevents open redirect */
function isSafeRedirect(url: string | null | undefined): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//')
}

// ---------------------------------------------------------------------------
// signUp — patient only
// FIX: stores redirectTo in Supabase user metadata so it survives
//      the email confirmation round-trip back to /auth/callback
// ---------------------------------------------------------------------------

export async function signUp(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getIp()

  const limited = await rateLimitAction('auth:signup', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/auth/signup')
    return limited
  }

  const validation = validateForm(SignUpSchema, formData)
  if (!validation.success) {
    securityLogger.log('VALIDATION_FAILED', { ip, details: { action: 'signUp' } })
    return validation
  }

  const { email, password, full_name, phone } = validation.data

  // Read redirectTo from the hidden form field (set by signup page from URL param)
  const redirectTo = (formData.get('redirectTo') as string | null)?.trim() || null
  const safeRedirect = isSafeRedirect(redirectTo) ? redirectTo : null

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=signup`,
      data: {
        full_name,
        role:  'patient',
        phone,
        // Store redirectTo in metadata so callback can read it after email confirm
        booking_redirect: safeRedirect,
      },
    },
  })

  if (authError) {
    securityLogger.log('AUTH_SIGNUP', { ip, details: { error: authError.message } })
    if (authError.message.toLowerCase().includes('already')) {
      return { success: false, error: 'Could not create account. Please try again.' }
    }
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: 'Account creation failed. Please try again.' }
  }

  securityLogger.log('AUTH_SIGNUP', {
    ip,
    userId: authData.user.id,
    details: { role: 'patient' },
  })

  redirect('/auth/confirm-email')
}

// ---------------------------------------------------------------------------
// signIn — all roles
// ---------------------------------------------------------------------------

export async function signIn(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getIp()

  const limited = await rateLimitAction('auth:login', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/auth/login')
    return limited
  }

  const validation = validateForm(SignInSchema, formData)
  if (!validation.success) {
    return validation
  }

  const redirectTo = (formData.get('redirectTo') as string | null)?.trim() || null
  console.log('[signIn] redirectTo:', redirectTo)

  const { email, password } = validation.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    securityLogger.authFailed(ip, { email_domain: email.split('@')[1] })
    return { success: false, error: 'Invalid email or password.' }
  }

  if (!data.user) {
    return { success: false, error: 'Sign in failed. Please try again.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, is_onboarded')
    .eq('id', data.user.id)
    .single<{ role: UserRole; is_onboarded: boolean }>()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'Your account is not fully set up. Please contact support.',
    }
  }

  securityLogger.log('AUTH_SIGNIN', {
    ip,
    userId: data.user.id,
    details: { role: profile.role },
  })

  if (profile.role === 'patient' && !profile.is_onboarded) {
    redirect('/auth/onboarding')
  }

  // Only patients can be redirected to booking pages
  // Staff and admin always go to their own dashboards
  if (redirectTo && profile.role === 'patient' && profile.is_onboarded) {
    if (isSafeRedirect(redirectTo)) {
      revalidatePath(redirectTo)
      redirect(redirectTo)
    }
  }

  revalidatePath(ROLE_DASHBOARD[profile.role])
  redirect(ROLE_DASHBOARD[profile.role])
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) securityLogger.log('AUTH_SIGNOUT', { userId: user.id })
  await supabase.auth.signOut()
  revalidatePath('/')
  redirect('/auth/login')
}

// ---------------------------------------------------------------------------
// acceptInvite — hospital staff / admin
// ---------------------------------------------------------------------------

export async function acceptInvite(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getIp()

  const limited = await rateLimitAction('auth:invite', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/auth/invite/accept')
    return limited
  }

  const validation = validateForm(AcceptInviteSchema, formData)
  if (!validation.success) return validation

  const { full_name, password } = validation.data
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return {
      success: false,
      error: 'Invite link is invalid or has expired. Please request a new invite.',
    }
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) return { success: false, error: passwordError.message }

  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  const role: UserRole = existingProfile?.role ?? 'hospital_staff'

  const { error: profileError } = await (supabase as any)
    .from('user_profiles')
    .upsert(
      { id: user.id, role, full_name, is_onboarded: true, is_active: true },
      { onConflict: 'id' },
    )

  if (profileError) {
    console.error('[acceptInvite] profile upsert failed:', profileError.message)
    return { success: false, error: 'Failed to save your profile. Please try again.' }
  }

  securityLogger.log('AUTH_INVITE_ACCEPTED', { ip, userId: user.id, details: { role } })
  revalidatePath(ROLE_DASHBOARD[role])
  redirect(ROLE_DASHBOARD[role])
}

// ---------------------------------------------------------------------------
// completeOnboard — patient only
// FIX: reads booking_redirect from Supabase user metadata and returns it
//      as state.data so the onboarding page can redirect there instead of /dashboard
// ---------------------------------------------------------------------------

export async function completeOnboard(
  _prevState: ActionResult<string>,
  formData: FormData,
): Promise<ActionResult<string>> {
  const ip = await getIp()

  const limited = await rateLimitAction('auth:onboard', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/auth/onboarding')
    return limited
  }

  const validation = validateForm(OnboardingSchema, formData)
  if (!validation.success) return validation

  const { date_of_birth, gender, city, blood_group } = validation.data

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Session expired. Please sign in again.' }
  }

  const { error: patientError } = await (supabase as any)
    .from('patient_profiles')
    .upsert(
      { id: user.id, date_of_birth, gender, city, blood_group: blood_group ?? null },
      { onConflict: 'id' },
    )

  if (patientError) {
    console.error('[completeOnboard] patient_profiles upsert failed:', patientError.message)
    return { success: false, error: 'Failed to save your profile. Please try again.' }
  }

  const { error: profileError } = await (supabase as any)
    .from('user_profiles')
    .update({ is_onboarded: true })
    .eq('id', user.id)

  if (profileError) {
    console.error('[completeOnboard] is_onboarded update failed:', profileError.message)
    return { success: false, error: 'Failed to complete onboarding. Please try again.' }
  }

  securityLogger.log('ONBOARDING_COMPLETE', { ip, userId: user.id })
  revalidatePath('/dashboard')

  // Read booking_redirect from user metadata — set during signUp
  // Also check the formData hidden field (set by onboarding page from URL param)
  // formData takes priority (more recent), metadata is the fallback
  const formRedirect = (formData.get('booking_redirect') as string | null)?.trim() || null
  const metaRedirect = (user.user_metadata?.booking_redirect as string | null) ?? null
  const destination  = isSafeRedirect(formRedirect)
    ? formRedirect
    : isSafeRedirect(metaRedirect)
      ? metaRedirect
      : '/dashboard'

  return { success: true, data: destination }
}

// ---------------------------------------------------------------------------
// inviteStaffMember — admin only
// ---------------------------------------------------------------------------

export async function inviteStaffMember(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getIp()

  const limited = await rateLimitAction('auth:invite', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/admin/staff/invite')
    return limited
  }

  const validation = validateForm(InviteStaffSchema, formData)
  if (!validation.success) return validation

  const { email, role, hospital_id } = validation.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Authentication required.' }

  const { data: callerProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (callerProfile?.role !== 'admin') {
    securityLogger.accessDenied(user.id, '/admin/staff/invite', 'not_admin')
    return { success: false, error: 'Only admins can invite staff members.' }
  }

  const serviceSupabase = createServiceClient()

  const { data: inviteData, error: inviteError } =
    await serviceSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/accept`,
      data: { role, invited_by: user.id },
    })

  if (inviteError) return { success: false, error: inviteError.message }
  if (!inviteData.user) return { success: false, error: 'Invite failed. Please try again.' }

  if (role === 'hospital_staff' && hospital_id) {
    await (serviceSupabase as any)
      .from('hospital_staff')
      .insert({
        hospital_id,
        user_id:    inviteData.user.id,
        role_label: 'staff',
        is_active:  true,
      })
  }

  securityLogger.adminAction(user.id, 'invite_staff', inviteData.user.id)
  securityLogger.log('AUTH_INVITE_SENT', {
    ip,
    userId: user.id,
    details: { role, invitedUserId: inviteData.user.id },
  })

  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// completeStaffSetup — hospital staff first-time setup
// ---------------------------------------------------------------------------

export async function completeStaffSetup(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Session expired. Please sign in again.' }
  }

  const full_name = (formData.get('full_name') as string)?.trim()
  const password  = (formData.get('password') as string)
  const confirm   = (formData.get('confirm_password') as string)

  if (!full_name || full_name.length < 2) return { success: false, error: 'Please enter your full name.' }
  if (!password || password.length < 8)   return { success: false, error: 'Password must be at least 8 characters.' }
  if (password !== confirm)               return { success: false, error: 'Passwords do not match.' }

  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) return { success: false, error: passwordError.message }

  const { error: profileError } = await (supabase as any)
    .from('user_profiles')
    .update({ full_name, is_onboarded: true, is_active: true })
    .eq('id', user.id)

  if (profileError) return { success: false, error: 'Failed to save your profile. Please try again.' }

  revalidatePath('/hospital/dashboard')
  return { success: true, data: undefined }
}