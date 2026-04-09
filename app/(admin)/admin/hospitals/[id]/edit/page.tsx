/**
 * app/(admin)/admin/hospitals/[id]/edit/page.tsx
 * Pre-loads existing hospital data including departments and services.
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/domain'
import EditHospitalForm from './edit-form'

export const metadata: Metadata = { title: 'Edit Hospital' }

interface Props { params: Promise<{ id: string }> }

export default async function EditHospitalPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch hospital + existing departments + existing services in parallel
  const [{ data: hospital }, { data: departments }, { data: services }] = await Promise.all([
    (supabase as any)
      .from('hospitals')
      .select('id, name, module, email, phone, website, address_line1, address_line2, city, state, pincode, description, platform_commission_pct')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    (supabase as any)
      .from('departments')
      .select('id, name')
      .eq('hospital_id', id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    (supabase as any)
      .from('services')
      .select('id, name, is_home_collection')
      .eq('hospital_id', id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
  ])

  if (!hospital) redirect('/admin/hospitals')

  // Extract clinic_type from description if present
  let clinicType = ''
  let cleanDescription = hospital.description ?? ''
  if (hospital.module === 'clinic' && hospital.description?.startsWith('Clinic type: ')) {
    const lines = hospital.description.split('\n\n')
    clinicType = lines[0].replace('Clinic type: ', '')
    cleanDescription = lines.slice(1).join('\n\n')
  }

  return (
    <EditHospitalForm
      hospital={{ ...hospital, description: cleanDescription }}
      existingDepartments={(departments ?? []).map((d: any) => d.name)}
      existingServices={(services ?? []).map((s: any) => ({
        name: s.name,
        homeCollection: s.is_home_collection ?? false,
      }))}
      existingClinicType={clinicType}
    />
  )
}