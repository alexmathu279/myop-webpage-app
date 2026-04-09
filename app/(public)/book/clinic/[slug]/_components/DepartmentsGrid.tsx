/**
 * app/(public)/book/clinic/[slug]/_components/DepartmentsGrid.tsx
 * Server Component.
 */

import Link from 'next/link'
import { Stethoscope, Calendar, ChevronRight, UserRound } from 'lucide-react'
import type { ClinicDepartment } from '@/lib/booking/clinic'

interface Props {
  departments: ClinicDepartment[]
  clinicSlug:  string
}

export default function DepartmentsGrid({ departments, clinicSlug }: Props) {
  if (departments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="font-medium">No departments available at this clinic yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept) => (
        <Link
          key={dept.id}
          href={`/book/clinic/${clinicSlug}/${dept.id}`}
          className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-violet-300 transition-all duration-200 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                {dept.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dept.icon_url} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <Stethoscope size={18} className="text-violet-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                  {dept.name}
                </h3>
                {/* has_doctors badge */}
                <div className="flex items-center gap-1 mt-0.5">
                  {dept.has_doctors ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <UserRound size={10} />
                      Doctors available
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} />
                      Walk-in booking
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-violet-400 transition-colors shrink-0 mt-1" />
          </div>

          {dept.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{dept.description}</p>
          )}

          {/* Fee */}
          {dept.fee !== null && !dept.has_doctors && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Consultation fee</span>
              <span className="text-sm font-bold text-gray-900">
                ₹{dept.fee.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}