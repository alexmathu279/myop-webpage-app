/**
 * app/(public)/book/clinic/[slug]/[deptId]/_components/DoctorsList.tsx
 * Server Component.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChevronRight } from 'lucide-react'
import type { ClinicDoctorSummary } from '@/lib/booking/clinic'

interface Props {
  doctors:    ClinicDoctorSummary[]
  clinicSlug: string
  deptId:     string
}

export default function DoctorsList({ doctors, clinicSlug, deptId }: Props) {
  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
        <p className="font-medium">No doctors currently available in this department.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Available Doctors
          <span className="ml-2 text-sm font-normal text-gray-400">({doctors.length})</span>
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {doctors.map((doctor) => (
          <Link
            key={doctor.id}
            href={`/book/clinic/${clinicSlug}/${deptId}/${doctor.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            {/* Photo */}
            <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-violet-50 border border-gray-100 flex items-center justify-center">
              {doctor.photo_url ? (
                <Image src={doctor.photo_url} alt={doctor.full_name} width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <span className="text-lg font-bold text-violet-400">{doctor.full_name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                {doctor.full_name}
              </p>
              <p className="text-xs text-violet-600 font-medium truncate">{doctor.specialisation}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {doctor.experience_years} yr{doctor.experience_years !== 1 ? 's' : ''} exp
                </span>
                <span className="text-gray-300">·</span>
                <span>{doctor.qualification}</span>
              </div>
            </div>

            {/* Fee */}
            <div className="shrink-0 text-right">
              <p className="font-bold text-gray-900 text-sm">
                ₹{doctor.consultation_fee.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-400">per visit</p>
            </div>

            <ChevronRight size={16} className="text-gray-300 group-hover:text-violet-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}