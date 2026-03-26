/**
 * app/(public)/hospitals/[slug]/book/[doctorId]/_components/DoctorProfileCard.tsx
 * Server Component.
 */

import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Stethoscope, GraduationCap, Clock, Languages } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DoctorDetail } from '@/lib/booking/hospital'

interface Props {
  doctor:       DoctorDetail
  hospitalName: string
  hospitalSlug: string
}

export default function DoctorProfileCard({ doctor, hospitalName, hospitalSlug }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {/* Breadcrumb */}
      <Link
        href={`/hospitals/${hospitalSlug}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-blue-600 transition-colors mb-5"
      >
        <ChevronLeft size={16} />
        Back to {hospitalName}
      </Link>

      <div className="flex flex-col sm:flex-row gap-5 items-start">

        {/* Photo */}
        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 border border-gray-100">
          {doctor.photo_url ? (
            <Image
              src={doctor.photo_url}
              alt={doctor.full_name}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-400 select-none">
                {doctor.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{doctor.full_name}</h1>
            <p className="text-blue-600 font-medium text-sm">{doctor.specialisation}</p>
            {doctor.department && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {doctor.department.name}
              </Badge>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <GraduationCap size={14} className="text-gray-400" />
              {doctor.qualification}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              {doctor.experience_years} yr{doctor.experience_years !== 1 ? 's' : ''} experience
            </span>
            {doctor.languages && doctor.languages.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Languages size={14} className="text-gray-400" />
                {doctor.languages.join(', ')}
              </span>
            )}
          </div>

          {/* Bio */}
          {doctor.bio && (
            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
              {doctor.bio}
            </p>
          )}

          {/* Fee */}
          <div className="flex items-center gap-2 pt-1">
            <Stethoscope size={15} className="text-green-500" />
            <span className="text-sm text-gray-600">Consultation fee:</span>
            <span className="font-bold text-gray-900 text-base">
              ₹{doctor.consultation_fee.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}