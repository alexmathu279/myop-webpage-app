/**
 * app/(public)/book/clinic/[slug]/[deptId]/_components/DepartmentHeader.tsx
 */

import Link from 'next/link'
import { ChevronLeft, Stethoscope } from 'lucide-react'
import type { ClinicDepartment, ClinicDetail } from '@/lib/booking/clinic'

interface Props {
  dept:   ClinicDepartment
  clinic: ClinicDetail
}

export default function DepartmentHeader({ dept, clinic }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <Link
        href={`/book/clinic/${clinic.slug}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-violet-600 transition-colors mb-4"
      >
        <ChevronLeft size={16} />
        Back to {clinic.name}
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
          <Stethoscope size={22} className="text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{dept.name}</h1>
          <p className="text-sm text-gray-500">{clinic.name} · {clinic.city}</p>
        </div>
      </div>

      {dept.description && (
        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{dept.description}</p>
      )}
    </div>
  )
}