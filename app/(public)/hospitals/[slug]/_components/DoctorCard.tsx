/**
 * app/(public)/hospitals/[slug]/_components/DoctorCard.tsx
 * Server Component.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Clock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DoctorSummary } from '@/lib/booking/hospital'

interface Props {
  doctor:       DoctorSummary
  hospitalSlug: string
}

export default function DoctorCard({ doctor, hospitalSlug }: Props) {
  const bookingHref = `/hospitals/${hospitalSlug}/book/${doctor.id}`

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5 flex flex-col gap-4">

        {/* Top — photo + name */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {doctor.photo_url ? (
              <Image
                src={doctor.photo_url}
                alt={doctor.full_name}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <span className="text-xl font-semibold text-blue-500 select-none">
                  {doctor.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {doctor.full_name}
            </h3>
            <p className="text-blue-600 text-xs font-medium mt-0.5 truncate">
              {doctor.specialisation}
            </p>
            {doctor.department && (
              <Badge variant="outline" className="mt-1 text-xs px-2 py-0">
                {doctor.department.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {doctor.experience_years} yr{doctor.experience_years !== 1 ? 's' : ''} exp
          </span>
          <span className="text-gray-300">·</span>
          <span className="truncate">{doctor.qualification}</span>
        </div>

        {/* Languages */}
        {doctor.languages && doctor.languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doctor.languages.slice(0, 3).map((lang) => (
              <span
                key={lang}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Fee + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div>
            <p className="text-xs text-gray-400">Consultation fee</p>
            <p className="text-base font-bold text-gray-900">
              ₹{doctor.consultation_fee.toLocaleString('en-IN')}
            </p>
          </div>
          <Link href={bookingHref}>
            <Button size="sm" className="text-xs">
              Book Slot
            </Button>
          </Link>
        </div>

      </CardContent>
    </Card>
  )
}