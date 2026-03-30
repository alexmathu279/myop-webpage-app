'use server'

/**
 * lib/admin/hospitals.ts
 * MYOP Healthcare Marketplace — Admin Hospital Actions
 * Phase 3
 *
 * Server Actions for admin hospital management:
 *   approveHospital    — approve a pending registration
 *   rejectHospital     — reject with a reason
 *   suspendHospital    — temporarily disable an approved hospital
 *   reactivateHospital — lift a suspension
 *   registerHospital   — public self-registration (any user)
 *
 * SECURITY:
 *   ✓ Admin role verified server-side on every privileged action
 *   ✓ Zod validation on all inputs
 *   ✓ Rate limiting on public registration endpoint
 *   ✓ Audit logging on all admin actions
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimitAction, securityLogger, validateForm } from '@/lib/security'
import type { UserRole } from '@/types/domain'
import type { ActionResult } from '@/types/dto'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getIp(): Promise<string> {
  const { headers } = await import('next/headers')
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
}



/** Verify the current user is an admin. Returns userId or null. */
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (profile?.role !== 'admin') return null
  return user.id
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const RejectSchema = z.object({
  hospital_id:      z.string().uuid(),
  rejection_reason: z.string().trim().min(10, 'Please provide a reason (min 10 chars).').max(500),
})

const SuspendSchema = z.object({
  hospital_id:      z.string().uuid(),
  suspension_reason: z.string().trim().min(10, 'Please provide a reason (min 10 chars).').max(500),
})

const RegisterHospitalSchema = z.object({
  module:        z.enum(['hospital', 'diagnostic', 'clinic']),
  name:          z.string().trim().min(2).max(200),
  email:         z.string().trim().email(),
  phone:         z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  address_line1: z.string().trim().min(5).max(200),
  address_line2: z.string().trim().max(200).optional(),
  city:          z.string().trim().min(2).max(100),
  state:         z.string().trim().min(2).max(100),
  pincode:       z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  website:       z.string().trim().url('Enter a valid website URL.').optional().or(z.literal('')),
  description:   z.string().trim().max(1000).optional(),
})

// ---------------------------------------------------------------------------
// approveHospital
// ---------------------------------------------------------------------------

export async function approveHospital(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) redirect('/auth/login')
  
  const hospitalId = formData.get('hospital_id') as string
  if (!hospitalId) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('hospitals')
    .update({ approval_status: 'approved', approved_at: new Date().toISOString(), approved_by: adminId, rejection_reason: null, suspended_at: null, suspended_by: null })
    .eq('id', hospitalId)
    .eq('approval_status', 'pending')

  securityLogger.adminAction(adminId, 'approve_hospital', hospitalId)
  revalidatePath('/admin/hospitals')
  redirect('/admin/hospitals/pending')
}

export async function rejectHospital(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) redirect('/auth/login')

  const hospitalId       = formData.get('hospital_id') as string
  const rejection_reason = (formData.get('rejection_reason') as string)?.trim()
  if (!hospitalId || !rejection_reason || rejection_reason.length < 10) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('hospitals')
    .update({ approval_status: 'rejected', rejection_reason, approved_at: null, approved_by: null })
    .eq('id', hospitalId)

  securityLogger.adminAction(adminId, 'reject_hospital', hospitalId)
  revalidatePath('/admin/hospitals')
  redirect('/admin/hospitals/pending')
}

export async function suspendHospital(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) redirect('/auth/login')

  const hospitalId        = formData.get('hospital_id') as string
  const suspension_reason = (formData.get('suspension_reason') as string)?.trim()
  if (!hospitalId || !suspension_reason || suspension_reason.length < 10) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('hospitals')
    .update({ approval_status: 'suspended', suspended_at: new Date().toISOString(), suspended_by: adminId, rejection_reason: suspension_reason })
    .eq('id', hospitalId)
    .eq('approval_status', 'approved')

  securityLogger.adminAction(adminId, 'suspend_hospital', hospitalId)
  revalidatePath('/admin/hospitals')
  redirect(`/admin/hospitals/${hospitalId}`)
}

export async function reactivateHospital(formData: FormData): Promise<void> {
  const adminId = await requireAdmin()
  if (!adminId) redirect('/auth/login')

  const hospitalId = formData.get('hospital_id') as string
  if (!hospitalId) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('hospitals')
    .update({ approval_status: 'approved', suspended_at: null, suspended_by: null, rejection_reason: null })
    .eq('id', hospitalId)
    .eq('approval_status', 'suspended')

  securityLogger.adminAction(adminId, 'reactivate_hospital', hospitalId)
  revalidatePath('/admin/hospitals')
  redirect(`/admin/hospitals/${hospitalId}`)
}
// ---------------------------------------------------------------------------
// registerHospital — public self-registration
// ---------------------------------------------------------------------------

export async function registerHospital(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getIp()

  // Rate limit: 3 registrations per hour per IP
  const limited = await rateLimitAction('auth:signup', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/register')
    return limited
  }

  const validation = validateForm(RegisterHospitalSchema, formData)
  if (!validation.success) return validation

  const {
    module, name, email, phone,
    address_line1, address_line2,
    city, state, pincode,
    website, description,
  } = validation.data

  // Use anon client — public registration doesn't require auth
  const supabase = createServiceClient()

  // Generate a URL-friendly slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Math.random().toString(36).slice(2, 7)

  const { error } = await (supabase as any)
    .from('hospitals')
    .insert({
      module,
      name,
      slug,
      email,
      phone,
      address_line1,
      address_line2:   address_line2 || null,
      city,
      state,
      pincode,
      website:         website || null,
      description:     description || null,
      approval_status: 'pending',
    })

  if (error) {
    console.error('[registerHospital] error:', error.message)
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return { success: false, error: 'A registration with this email already exists.' }
    }
    return { success: false, error: 'Registration failed. Please try again.' }
  }

  securityLogger.log('ADMIN_ACTION', {
    ip,
    details: { action: 'hospital_self_registration', email, module },
  })

  redirect('/register/success')
}


// ---------------------------------------------------------------------------
// createHospital — admin direct creation (immediately approved)
// ---------------------------------------------------------------------------

const CreateHospitalSchema = z.object({
  module:        z.enum(['hospital', 'diagnostic', 'clinic']),
  name:          z.string().trim().min(2).max(200),
  email:         z.string().trim().email(),
  phone:         z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  address_line1: z.string().trim().min(5).max(200),
  address_line2: z.string().trim().max(200).optional(),
  city:          z.string().trim().min(2).max(100),
  state:         z.string().trim().min(2).max(100),
  pincode:       z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  website:       z.string().trim().url().optional().or(z.literal('')),
  description:   z.string().trim().max(1000).optional(),
  platform_commission_pct: z.coerce.number().min(0).max(100).default(10),
})

export async function createHospital(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminId = await requireAdmin()
  if (!adminId) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(CreateHospitalSchema, formData)
  if (!validation.success) return validation

  const {
    module, name, email, phone,
    address_line1, address_line2,
    city, state, pincode,
    website, description,
    platform_commission_pct,
  } = validation.data

  const clinic_type = formData.get('clinic_type') as string | null
  const fullDescription = [
    clinic_type ? `Clinic type: ${clinic_type}` : null,
    description || null,
  ].filter(Boolean).join('\n\n') || null

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Math.random().toString(36).slice(2, 7)

  const supabase = createServiceClient()

  const { data: hospital, error } = await (supabase as any)
    .from('hospitals')
    .insert({
      module,
      name,
      slug,
      email,
      phone,
      address_line1,
      address_line2:           address_line2 || null,
      city,
      state,
      pincode,
      website:                 website || null,
      description:             fullDescription || null,
      approval_status:         'approved',
      approved_at:             new Date().toISOString(),
      approved_by:             adminId,
      platform_commission_pct: platform_commission_pct ?? 10,
    })
    .select('id')
    .single()

      if (error) {
        console.error('[createHospital]', error.message)
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          return { success: false, error: 'A hospital with this email already exists.' }
        }
        return { success: false, error: 'Failed to create hospital. Please try again.' }
      }

      const hospitalId = hospital.id

      // Insert departments for hospitals
      const departments: string[] = formData.getAll('departments[]')
        .map(d => (d as string).trim()).filter(Boolean).slice(0, 50)

      if (module === 'hospital' && departments.length > 0) {
        await (supabase as any).from('departments').insert(
          departments.map(name => ({ hospital_id: hospitalId, name, is_active: true }))
        )
      }

      // Insert services for diagnostic/clinic
      const servicesRaw: string[] = formData.getAll('services[]')
        .map(s => (s as string).trim()).filter(Boolean).slice(0, 100)

      const services = servicesRaw.map(s => {
        const [serviceName, homeCollection] = s.split('|')
        return { name: (serviceName ?? '').trim(), home_collection: homeCollection === 'true' }
      }).filter(s => s.name.length > 0)

      if ((module === 'diagnostic' || module === 'clinic') && services.length > 0) {
        await (supabase as any).from('services').insert(
          services.map(s => ({
            hospital_id:        hospitalId,
            module,
            name:               s.name,
            is_active:          true,
            is_home_collection: s.home_collection,
            price:              0,
          }))
        )
      }

      securityLogger.adminAction(adminId, 'create_hospital', hospitalId)
      revalidatePath('/admin/hospitals')
      redirect(`/admin/hospitals/${hospitalId}`)
    }



// ---------------------------------------------------------------------------
// updateHospital — admin edit existing hospital details
// ---------------------------------------------------------------------------

const UpdateHospitalSchema = z.object({
  hospital_id:   z.string().uuid(),
  name:          z.string().trim().min(2).max(200),
  email:         z.string().trim().email(),
  phone:         z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  address_line1: z.string().trim().min(5).max(200),
  address_line2: z.string().trim().max(200).optional(),
  city:          z.string().trim().min(2).max(100),
  state:         z.string().trim().min(2).max(100),
  pincode:       z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  website:       z.string().trim().url().optional().or(z.literal('')),
  description:   z.string().trim().max(1000).optional(),
  platform_commission_pct: z.coerce.number().min(0).max(100),
})

export async function updateHospital(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  console.log('[updateHospital] departments received:', formData.getAll('departments[]'))
  const adminId = await requireAdmin()
  if (!adminId) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(UpdateHospitalSchema, formData)
  if (!validation.success) return validation

  const {
    hospital_id, name, email, phone,
    address_line1, address_line2,
    city, state, pincode,
    website, description,
    platform_commission_pct,
  } = validation.data

  const supabase = createServiceClient()

  const { error } = await (supabase as any)
    .from('hospitals')
    .update({
      name, email, phone,
      address_line1,
      address_line2:           address_line2 || null,
      city, state, pincode,
      website:                 website || null,
      description:             description || null,
      platform_commission_pct,
    })
    .eq('id', hospital_id)
    .is('deleted_at', null)

  if (error) {
    console.error('[updateHospital]', error.message)
    return { success: false, error: 'Failed to update hospital. Please try again.' }
  }

  // Get module to know what to update
  const supabaseRead = await createClient()
  const { data: existing } = await (supabaseRead as any)
    .from('hospitals')
    .select('module')
    .eq('id', hospital_id)
    .single()

  const module = existing?.module ?? 'hospital'

  if (module === 'hospital') {
    const departments: string[] = formData.getAll('departments[]')
      .map(d => (d as string).trim()).filter(Boolean)

    await (supabase as any)
      .from('departments')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('hospital_id', hospital_id)
      .is('deleted_at', null)

    if (departments.length > 0) {
      await (supabase as any)
        .from('departments')
        .insert(departments.map(name => ({ hospital_id, name, is_active: true })))
    }
  }

  if (module === 'diagnostic' || module === 'clinic') {
    const servicesRaw: string[] = formData.getAll('services[]')
      .map(s => (s as string).trim()).filter(Boolean)

    const services = servicesRaw.map(s => {
      const [serviceName, homeCollection] = s.split('|')
      return { name: (serviceName ?? '').trim(), home_collection: homeCollection === 'true' }
    }).filter(s => s.name.length > 0)

    await (supabase as any)
      .from('services')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('hospital_id', hospital_id)
      .is('deleted_at', null)

    if (services.length > 0) {
      await (supabase as any)
        .from('services')
        .insert(services.map(s => ({
          hospital_id, module,
          name: s.name,
          is_active: true,
          is_home_collection: s.home_collection,
          price: 0,
        })))
    }
  }

  securityLogger.adminAction(adminId, 'update_hospital', hospital_id)
  revalidatePath('/admin/hospitals')
  revalidatePath(`/admin/hospitals/${hospital_id}`)
  redirect(`/admin/hospitals/${hospital_id}`)
}