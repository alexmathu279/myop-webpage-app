/**
 * app/(public)/book/diagnostic/_components/DiagnosticCard.tsx
 */

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, FlaskConical } from 'lucide-react'
import type { DiagnosticCentreSearchResult } from '@/lib/booking/diagnostic'

interface Props {
  centre: DiagnosticCentreSearchResult
}

export default function DiagnosticCard({ centre }: Props) {
  return (
    <Link href={`/book/diagnostic/${centre.slug}`} className="group block">
      <div className="h-full bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">

        {/* Top row */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-cyan-50 flex items-center justify-center border border-gray-100">
            {centre.logo_url ? (
              <Image
                src={centre.logo_url}
                alt={`${centre.name} logo`}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold text-cyan-500 select-none">
                {centre.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-cyan-600 transition-colors truncate">
              {centre.name}
            </h2>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{centre.city}, {centre.state}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {centre.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {centre.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Phone size={12} />
            <span>{centre.phone}</span>
          </div>
          <div className="flex items-center gap-1 bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full font-medium">
            <FlaskConical size={11} />
            {centre.services_count} test{centre.services_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </Link>
  )
}