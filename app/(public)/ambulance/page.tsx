/**
 * app/(public)/ambulance/page.tsx
 * Server component shell — fetches available ambulances
 */

import type { Metadata } from 'next'
import { cachedGetAvailableAmbulances } from '@/lib/ambulance/queries'
import AmbulanceBookingClient from './_components/AmbulanceBookingClient'

export const metadata: Metadata = {
  title:       'Book an Ambulance',
  description: 'Fast ambulance booking — basic, advanced, ICU and neonatal ambulances.',
}

export default async function AmbulancePage() {
  const ambulances = await cachedGetAvailableAmbulances()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚑</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book an Ambulance</h1>
        </div>
        <p className="text-gray-500 text-sm">Available 24/7. Our team will confirm within minutes.</p>
      </div>

      <AmbulanceBookingClient ambulances={ambulances} />
    </div>
  )
}