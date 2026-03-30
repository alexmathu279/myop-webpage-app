/**
 * app/(public)/book/clinic/page.tsx
 */

import type { Metadata } from 'next'
import { searchClinics } from '@/lib/booking/clinic'
import ClinicClient from './_components/ClinicClient'

export const metadata: Metadata = {
  title:       'Find Clinics',
  description: 'Find specialist clinics near you and book appointments.',
}

export default async function ClinicPage() {
  const initialClinics = await searchClinics('')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Find a Clinic
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
          Search by clinic name, speciality, or doctor name.
        </p>
      </div>

      <ClinicClient initialClinics={initialClinics} />
    </div>
  )
}