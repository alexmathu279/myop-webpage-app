'use server'

/**
 * lib/admin/register.ts
 * MYOP Healthcare Marketplace
 *
 * Public hospital self-registration server action.
 * Separated from admin/hospitals.ts to keep concerns clean.
 *
 * After registration is approved by admin, the hospital's
 * departments/services are created from the submitted data.
 * Doctors/staff are added later by staff from their dashboard.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAction, securityLogger, validateForm } from '@/lib/security'
import type { ActionResult } from '@/types/dto'

async function getIp(): Promise<string> {
  const { headers } = await import('next/headers')
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const RegisterSchema = z.object({
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
  // Clinic-specific
  clinic_type:   z.string().trim().max(100).optional(),
})

// ---------------------------------------------------------------------------
// registerHospital
// ---------------------------------------------------------------------------

export async function registerHospital(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getIp()

  const limited = await rateLimitAction('auth:signup', ip)
  if (limited) {
    securityLogger.rateLimitHit(ip, '/register')
    return limited
  }

  const validation = validateForm(RegisterSchema, formData)
  if (!validation.success) return validation

  const {
    module, name, email, phone,
    address_line1, address_line2,
    city, state, pincode,
    website, description,
    clinic_type,
  } = validation.data

  // Extract departments (hospital) or services (diagnostic/clinic)
  // These come as repeated form fields: departments[] or services[]
  const departments: string[] = formData.getAll('departments[]')
    .map(d => (d as string).trim())
    .filter(Boolean)
    .slice(0, 50)

  // Services come as JSON-encoded objects: {name, home_collection}
  const servicesRaw: string[] = formData.getAll('services[]')
    .map(s => (s as string).trim())
    .filter(Boolean)
    .slice(0, 100)

  // Parse services - each is "name|home_collection" format
  const services = servicesRaw.map(s => {
    const [serviceName, homeCollection] = s.split('|')
    return {
      name:            (serviceName ?? '').trim(),
      home_collection: homeCollection === 'true',
    }
  }).filter(s => s.name.length > 0)

  const supabase = await createClient()

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    + '-' + Math.random().toString(36).slice(2, 7)

  // Build description with clinic type if applicable
  const fullDescription = [
    clinic_type ? `Clinic type: ${clinic_type}` : null,
    description || null,
  ].filter(Boolean).join('\n\n') || null

  const { data: hospital, error } = await (supabase as any)
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
      description:     fullDescription,
      approval_status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[registerHospital] error:', error.message)
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return { success: false, error: 'A registration with this email already exists.' }
    }
    return { success: false, error: 'Registration failed. Please try again.' }
  }

  const hospitalId = hospital.id

  // Insert departments for hospitals
  if (module === 'hospital' && departments.length > 0) {
    const deptRows = departments.map(name => ({
      hospital_id: hospitalId,
      name,
      is_active: true,
    }))
    await (supabase as any).from('departments').insert(deptRows)
  }

  // Insert services for diagnostic centres and clinics
  if ((module === 'diagnostic' || module === 'clinic') && services.length > 0) {
    const serviceRows = services.map(s => ({
      hospital_id:        hospitalId,
      module,
      name:               s.name,
      is_active:          true,
      is_home_collection: s.home_collection,
      price:              0,  // price set by staff after approval
    }))
    await (supabase as any).from('services').insert(serviceRows)
  }

  securityLogger.log('ADMIN_ACTION', {
    ip,
    details: { action: 'hospital_self_registration', email, module },
  })

  redirect('/register/success')
}