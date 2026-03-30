/**
 * app/(public)/book/clinic/_components/ClinicCard.tsx
 */

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Stethoscope } from 'lucide-react'
import type { ClinicSearchResult } from '@/lib/booking/clinic'

interface Props {
  clinic: ClinicSearchResult
}

export default function ClinicCard({ clinic }: Props) {
  return (
    <Link href={`/book/clinic/${clinic.slug}`} className="group block">
      <div className="h-full bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">

        {/* Top row */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-violet-50 flex items-center justify-center border border-gray-100">
            {clinic.logo_url ? (
              <Image src={clinic.logo_url} alt={`${clinic.name} logo`} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <span className="text-2xl font-bold text-violet-500 select-none">
                {clinic.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-violet-600 transition-colors truncate">
              {clinic.name}
            </h2>
            {/* Speciality — prominent */}
            {clinic.speciality && (
              <div className="flex items-center gap-1 mt-1">
                <Stethoscope size={12} className="text-violet-500 shrink-0" />
                <span className="text-sm font-medium text-violet-600 truncate">
                  {clinic.speciality}
                  {clinic.departments_count > 1 && ` + ${clinic.departments_count - 1} more`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{clinic.city}, {clinic.state}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {clinic.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {clinic.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Phone size={12} />
            <span>{clinic.phone}</span>
          </div>
          <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded-full font-medium">
            {clinic.departments_count} dept{clinic.departments_count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}