/**
 * app/(public)/hospitals/[slug]/_components/HospitalHeader.tsx
 * Server Component — hospital banner / info card.
 */

import Image from 'next/image'
import { MapPin, Phone, Globe, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { HospitalDetail } from '@/lib/booking/hospital'

interface Props {
  hospital: HospitalDetail
}

export default function HospitalHeader({ hospital }: Props) {
  const address = [
    hospital.address_line1,
    hospital.address_line2,
    hospital.city,
    hospital.state,
    hospital.pincode,
  ].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6 items-start">

        {/* Logo */}
        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 flex items-center justify-center border border-gray-100">
          {hospital.logo_url ? (
            <Image
              src={hospital.logo_url}
              alt={`${hospital.name} logo`}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-3xl font-bold text-blue-400 select-none">
              {hospital.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {hospital.name}
            </h1>
            {hospital.departments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hospital.departments.slice(0, 5).map((d) => (
                  <Badge key={d.id} variant="secondary" className="text-xs">
                    {d.name}
                  </Badge>
                ))}
                {hospital.departments.length > 5 && (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    +{hospital.departments.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {hospital.description && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              {hospital.description}
            </p>
          )}

          {/* Contact row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="shrink-0 text-gray-400" />
              {address}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={14} className="shrink-0 text-gray-400" />
              {hospital.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={14} className="shrink-0 text-gray-400" />
              {hospital.email}
            </span>
            {hospital.website && (
              <a
                href={hospital.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
              >
                <Globe size={14} className="shrink-0 text-gray-400" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}