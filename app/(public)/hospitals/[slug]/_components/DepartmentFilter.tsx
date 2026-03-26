'use client'

/**
 * app/(public)/hospitals/[slug]/_components/DepartmentFilter.tsx
 * Client Component — pill tabs that set ?dept= URL param.
 * Server re-renders the page with filtered doctors.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Department {
  id:   string
  name: string
}

interface Props {
  departments:  Department[]
  activeDeptId: string | undefined
}

export default function DepartmentFilter({ departments, activeDeptId }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  function selectDept(deptId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (deptId) {
      params.set('dept', deptId)
    } else {
      params.delete('dept')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* All departments pill */}
      <button
        onClick={() => selectDept(null)}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
          !activeDeptId
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600',
        )}
      >
        All
      </button>

      {departments.map((dept) => (
        <button
          key={dept.id}
          onClick={() => selectDept(dept.id)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
            activeDeptId === dept.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600',
          )}
        >
          {dept.name}
        </button>
      ))}
    </div>
  )
}