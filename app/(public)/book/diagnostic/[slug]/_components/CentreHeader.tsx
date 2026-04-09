/**
 * app/(public)/book/diagnostic/[slug]/_components/CentreHeader.tsx
 * Server Component.
 */

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Globe, Mail, ChevronLeft } from 'lucide-react'
import type { DiagnosticCentreDetail } from '@/lib/booking/diagnostic'

interface Props {
  centre: DiagnosticCentreDetail
}

export default function CentreHeader({ centre }: Props) {
  const address = [
    centre.address_line1,
    centre.address_line2,
    centre.city,
    centre.state,
    centre.pincode,
  ].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
      {/* Breadcrumb */}
      <Link
        href="/book/diagnostic"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-600 transition-colors mb-5"
      >
        <ChevronLeft size={16} />
        Back to diagnostic centres
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Logo */}
        <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-cyan-50 border border-gray-100 flex items-center justify-center">
          {centre.logo_url ? (
            <Image
              src={centre.logo_url}
              alt={`${centre.name} logo`}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-3xl font-bold text-cyan-500 select-none">
              {centre.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {centre.name}
            </h1>
          </div>

          {centre.description && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              {centre.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="shrink-0 text-gray-400" />
              {address}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={14} className="shrink-0 text-gray-400" />
              {centre.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={14} className="shrink-0 text-gray-400" />
              {centre.email}
            </span>
            {centre.website && (
              <a
                href={centre.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-cyan-600 transition-colors"
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