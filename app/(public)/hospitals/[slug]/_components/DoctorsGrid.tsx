/**
 * app/(public)/hospitals/[slug]/_components/DoctorsGrid.tsx
 * Server Component.
 */

import type { DoctorSummary } from '@/lib/booking/hospital'
import DoctorCard from './DoctorCard'

interface Props {
  doctors:      DoctorSummary[]
  hospitalSlug: string
}

export default function DoctorsGrid({ doctors, hospitalSlug }: Props) {
  if (doctors.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-base font-medium mb-1">No doctors found</p>
        <p className="text-sm">Try selecting a different department.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {doctors.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          hospitalSlug={hospitalSlug}
        />
      ))}
    </div>
  )
}