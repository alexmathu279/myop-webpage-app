/**
 * app/(patient)/book/confirm/page.tsx
 *
 * Booking confirmation — fully behind auth (middleware protects /book/confirm).
 *
 * URL: /book/confirm?slot=<slotId>
 *
 * SECURITY:
 *   - Only slotId comes from the URL — nothing else is trusted from client
 *   - Doctor and hospital are derived server-side from slot.doctor_id / slot.hospital_id
 *   - Slot is re-validated server-side: must be available, not blocked, not expired
 *   - If slot is invalid → redirect back to hospitals search with a message
 *   - Patient identity comes from the server session — never from URL params
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSlotById, getDoctorById, getHospitalBySlug } from '@/lib/booking/hospital'
import ConfirmClient from './_components/ConfirmClient'

export const metadata: Metadata = { title: 'Confirm Booking' }

interface PageProps {
  searchParams: Promise<{ slot?: string }>
}

export default async function BookConfirmPage({ searchParams }: PageProps) {
  const { slot: slotId } = await searchParams

  // Missing slot param → back to search
  if (!slotId) {
    redirect('/hospitals')
  }

  // ── Step 1: Validate slot server-side ──
  // getSlotById checks: is_available, is_blocked, booked_count < max_bookings,
  // slot_start > now(). Returns null if any check fails.
  const slot = await getSlotById(slotId)

  if (!slot) {
    // Slot expired, fully booked, or doesn't exist
    redirect('/hospitals?error=slot_expired')
  }

  // ── Step 2: Derive doctor + hospital from slot (never from URL) ──
  // We need the hospital slug for getHospitalBySlug.
  // Fetch hospital by ID first, then get full detail by slug.
  const supabase = await createClient()

  const { data: hospitalRow } = await supabase
    .from('hospitals')
    .select('slug')
    .eq('id', slot.hospital_id)
    .eq('module', 'hospital')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .single<{ slug: string }>()

  if (!hospitalRow) {
    redirect('/hospitals?error=not_found')
  }

  const [hospital, doctor] = await Promise.all([
    getHospitalBySlug(hospitalRow.slug),
    getDoctorById(slot.doctor_id, slot.hospital_id),
  ])

  if (!hospital || !doctor) {
    redirect('/hospitals?error=not_found')
  }

  // ── Step 3: Get patient from session (never from URL) ──
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware already protects this route, but double-check
  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(`/book/confirm?slot=${slotId}`)}`)
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single<{ full_name: string }>()

  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('phone, date_of_birth, gender')
    .eq('id', user.id)
    .single<{ phone: string | null; date_of_birth: string | null; gender: string | null }>()

  return (
    <ConfirmClient
      slot={slot}
      doctor={doctor}
      hospital={{
        id:       hospital.id,
        name:     hospital.name,
        slug:     hospital.slug,
        logo_url: hospital.logo_url,
        city:     hospital.city,
        state:    hospital.state,
      }}
      patient={{
        id:            user.id,
        full_name:     userProfile?.full_name ?? '',
        phone:         patientProfile?.phone ?? '',
        date_of_birth: patientProfile?.date_of_birth ?? null,
        gender:        patientProfile?.gender ?? null,
      }}
    />
  )
}