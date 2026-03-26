/**
 * app/(public)/hospitals/_components/HospitalCard.tsx
 * Server Component — no interactivity needed, just a link card.
 */

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Hospital {
  id:            string
  name:          string
  slug:          string
  logo_url:      string | null
  city:          string
  state:         string
  address_line1: string
  phone:         string
  description:   string | null
  doctors_count: number
}

interface Props {
  hospital: Hospital
}

export default function HospitalCard({ hospital }: Props) {
  return (
    <Link href={`/hospitals/${hospital.slug}`} className="group block">
      <Card className="h-full hover:shadow-md transition-shadow duration-200 border border-gray-200">
        <CardContent className="p-5 flex flex-col gap-4">

          {/* Top row — logo + name */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center border border-gray-100">
              {hospital.logo_url ? (
                <Image
                  src={hospital.logo_url}
                  alt={`${hospital.name} logo`}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-blue-400 select-none">
                  {hospital.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors truncate">
                {hospital.name}
              </h2>
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{hospital.city}, {hospital.state}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {hospital.description && (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {hospital.description}
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Phone size={12} />
              <span>{hospital.phone}</span>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Users size={11} />
              {hospital.doctors_count} doctor{hospital.doctors_count !== 1 ? 's' : ''}
            </Badge>
          </div>

        </CardContent>
      </Card>
    </Link>
  )
}