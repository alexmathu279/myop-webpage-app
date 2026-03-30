/**
 * app/(patient)/book/confirm/clinic/page.tsx
 *
 * Clinic booking confirmation — walk-in (no doctor) flow only.
 * Doctor flow reuses /book/confirm?slot=X.
 *
 * URL: /book/confirm/clinic?clinic=slug&dept=deptId&date=YYYY-MM-DD
 *
 * SECURITY:
 *   - clinic slug + dept ID re-validated server-side
 *   - date validated (must be future)
 *   - fee read from departments table server-side — never from URL
 *   - patient identity from session
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClinicBySlug, getClinicDepartment } from '@/lib/booking/clinic'
import ClinicConfirmClient from './_components/ClinicConfirmClient'

export const metadata: Metadata = { title: 'Confirm Clinic Appointment' }

interface PageProps {
  searchParams: Promise<{ clinic?: string; dept?: string; date?: string }>
}

export default async function ClinicConfirmPage({ searchParams }: PageProps) {
  const { clinic: clinicSlug, dept: deptId, date } = await searchParams

  if (!clinicSlug || !deptId || !date) redirect('/book/clinic')

  // Validate date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/book/clinic')
  const bookingDate = new Date(`${date}T00:00:00Z`)
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  if (bookingDate < tomorrow) redirect('/book/clinic?error=invalid_date')

  // Validate clinic
  const clinic = await getClinicBySlug(clinicSlug)
  if (!clinic) redirect('/book/clinic?error=not_found')

  // Validate department — scoped to clinic
  const dept = await getClinicDepartment(clinic!.id, deptId)
  if (!dept) redirect(`/book/clinic/${clinicSlug}?error=not_found`)

  // This page is only for no-doctor departments
  // If dept has doctors, they should be on /book/confirm?slot=X
  if (dept.has_doctors) redirect(`/book/clinic/${clinicSlug}/${deptId}`)

  // Get patient from session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(
      `/book/confirm/clinic?clinic=${clinicSlug}&dept=${deptId}&date=${date}`
    )}`)
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single<{ full_name: string }>()

  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('phone')
    .eq('id', user.id)
    .single<{ phone: string | null }>()

  return (
    <ClinicConfirmClient
      clinic={{
        id:       clinic!.id,
        name:     clinic!.name,
        slug:     clinic!.slug,
        logo_url: clinic!.logo_url,
        city:     clinic!.city,
        state:    clinic!.state,
      }}
      dept={{
        id:   dept.id,
        name: dept.name,
        fee:  dept.fee,
      }}
      bookingDate={date}
      patient={{
        id:        user.id,
        full_name: userProfile?.full_name ?? '',
        phone:     patientProfile?.phone ?? '',
      }}
    />
  )
}