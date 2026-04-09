/**
 * app/(patient)/book/confirm/diagnostic/page.tsx
 *
 * Diagnostic booking confirmation — fully behind auth.
 *
 * URL: /book/confirm/diagnostic?centre=slug&services=id1,id2&type=walkin|home&date=YYYY-MM-DD
 *
 * SECURITY:
 *   - centre slug and service IDs come from URL but are re-validated server-side
 *   - getDiagnosticServicesByIds scopes to centreId — cannot fetch another centre's services
 *   - date validated server-side (must be future, valid format)
 *   - collection type validated (must be walkin|home, home only if all services support it)
 *   - patient identity from session — never from URL
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getDiagnosticCentreBySlug,
  getDiagnosticServicesByIds,
} from '@/lib/booking/diagnostic'
import DiagnosticConfirmClient from './_components/DiagnosticConfirmClient'

export const metadata: Metadata = { title: 'Confirm Lab Test Booking' }

interface PageProps {
  searchParams: Promise<{
    centre?:   string
    services?: string
    type?:     string
    date?:     string
  }>
}

export default async function DiagnosticConfirmPage({ searchParams }: PageProps) {
  const { centre: centreSlug, services: servicesParam, type, date } = await searchParams

  // All params required
  if (!centreSlug || !servicesParam || !date) {
    redirect('/book/diagnostic')
  }

  // ── Validate collection type ──
  const collectionType = type === 'home' ? 'home' : 'walkin'

  // ── Validate date ──
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirect('/book/diagnostic')
  }
  const bookingDate = new Date(`${date}T00:00:00Z`)
  const tomorrow    = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  if (bookingDate < tomorrow) {
    redirect('/book/diagnostic?error=invalid_date')
  }

  // ── Validate centre ──
  const centre = await getDiagnosticCentreBySlug(centreSlug)
  if (!centre) redirect('/book/diagnostic?error=not_found')

  // ── Validate services (server-side, scoped to centre) ──
  const serviceIds = servicesParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .slice(0, 20) // safety cap

  if (serviceIds.length === 0) redirect('/book/diagnostic')

  const services = await getDiagnosticServicesByIds(centre!.id, serviceIds)
  if (services.length === 0) redirect('/book/diagnostic?error=invalid_services')

  // ── Validate home collection ──
  if (collectionType === 'home' && !services.every((s) => s.is_home_collection)) {
    redirect(`/book/diagnostic/${centreSlug}?error=home_not_available`)
  }

  // ── Get patient from session ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(
      `/book/confirm/diagnostic?centre=${centreSlug}&services=${servicesParam}&type=${collectionType}&date=${date}`
    )}`)
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single<{ full_name: string }>()

  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('phone, address, city')
    .eq('id', user.id)
    .single<{ phone: string | null; address: string | null; city: string | null }>()

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)

  return (
    <DiagnosticConfirmClient
      centre={{
        id:       centre!.id,
        name:     centre!.name,
        slug:     centre!.slug,
        logo_url: centre!.logo_url,
        city:     centre!.city,
        state:    centre!.state,
        phone:    centre!.phone,
        address:  centre!.address_line1,
      }}
      services={services}
      collectionType={collectionType}
      bookingDate={date}
      totalPrice={totalPrice}
      patient={{
        id:        user.id,
        full_name: userProfile?.full_name ?? '',
        phone:     patientProfile?.phone ?? '',
        address:   patientProfile?.address ?? '',
        city:      patientProfile?.city ?? '',
      }}
    />
  )
}