/**
 * app/(public)/ambulance/status/[id]/page.tsx
 *
 * Server Component — fetches booking server-side (no API route needed).
 * Passes booking data to AmbulanceStatusClient for simulated progression.
 *
 * No API route required — data flows: DB → server component → client props.
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBookingById } from '@/lib/ambulance/queries'
import AmbulanceStatusClient from './_components/AmbulanceStatusClient'

export const metadata: Metadata = { title: 'Ambulance Status' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AmbulanceStatusPage({ params }: PageProps) {
  const { id } = await params

  // Auth required
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirectTo=/ambulance/status/${id}`)

  // Fetch booking — scoped to patient (getBookingById checks patient_id = user.id)
  const booking = await getBookingById(id)
  if (!booking) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <AmbulanceStatusClient booking={booking} />
    </div>
  )
}