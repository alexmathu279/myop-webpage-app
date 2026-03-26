/**
 * app/(public)/hospitals/page.tsx
 *
 * Server Component shell — fetches all hospitals on load.
 * Passes them to HospitalsClient which handles search inline
 * (debounced fetch to /api/hospitals/search, no navigation).
 */

import type { Metadata } from 'next'
import { searchHospitals } from '@/lib/booking/hospital'
import HospitalsClient from './_components/HospitalsClient'

export const metadata: Metadata = {
  title:       'Find Doctors & Hospitals',
  description: 'Search hospitals and book doctor appointments near you.',
}

export default async function HospitalsPage() {
  // Initial load — all hospitals, no query
  const initialHospitals = await searchHospitals('')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Find a Doctor
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
          Search by hospital name, doctor name, speciality, or department.
        </p>
      </div>

      <HospitalsClient initialHospitals={initialHospitals} />
    </div>
  )
}