/**
 * app/(public)/book/clinic/[slug]/_components/ClinicDetailHeader.tsx
 */

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Globe, Mail, ChevronLeft } from 'lucide-react'
import type { ClinicDetail } from '@/lib/booking/clinic'

interface Props { clinic: ClinicDetail }

export default function ClinicDetailHeader({ clinic }: Props) {
  const address = [clinic.address_line1, clinic.address_line2, clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <Link href="/book/clinic" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-violet-600 transition-colors mb-5">
        <ChevronLeft size={16} />
        Back to clinics
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-violet-50 border border-gray-100 flex items-center justify-center">
          {clinic.logo_url ? (
            <Image src={clinic.logo_url} alt={clinic.name} width={80} height={80} className="object-cover w-full h-full" />
          ) : (
            <span className="text-3xl font-bold text-violet-500 select-none">{clinic.name.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
          {clinic.description && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{clinic.description}</p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" />{address}</span>
            <span className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400" />{clinic.phone}</span>
            <span className="flex items-center gap-1.5"><Mail size={14} className="text-gray-400" />{clinic.email}</span>
            {clinic.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-violet-600 transition-colors">
                <Globe size={14} className="text-gray-400" />Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}