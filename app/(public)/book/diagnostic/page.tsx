/**
 * app/(public)/book/diagnostic/page.tsx
 * Public — no auth required.
 */
/**
 * app/(public)/book/diagnostic/page.tsx
 */

import type { Metadata } from 'next'
import { cachedSearchDiagnosticCentres } from '@/lib/supabase/cached-queries'
import DiagnosticClient from './_components/DiagnosticClient'
import PremiumShowcasediagnostic from './_components/PremiumShowcasediagnostic'

export const metadata: Metadata = {
  title:       'Book Lab Tests & Diagnostics',
  description: 'Find diagnostic centres near you and book lab tests online.',
}

export default async function DiagnosticPage() {
  const initialCentres = await cachedSearchDiagnosticCentres('')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Book Lab Tests
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
          Search diagnostic centres by name or test type.
        </p>
      </div>

      <PremiumShowcasediagnostic />
      <DiagnosticClient initialCentres={initialCentres} />
    </div>
  )
}