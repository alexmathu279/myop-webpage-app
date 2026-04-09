'use client'

/**
 * app/(public)/hospitals/[slug]/book/[doctorId]/_components/DateStrip.tsx
 * Client Component — horizontal 7-day date selector.
 *
 * - Updates ?date= URL param on click (triggers server re-render)
 * - Shows green dot on days that have available slots
 * - Highlights today and selected date
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  /** ISO date string 'YYYY-MM-DD' — the anchor of the 7-day window */
  startDate:    string
  /** Currently selected date 'YYYY-MM-DD' */
  selectedDate: string
  /** Map of 'YYYY-MM-DD' → slot count for dot indicators */
  slotsPerDay:  Record<string, number>
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]

export default function DateStrip({ startDate, selectedDate, slotsPerDay }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // Build 7 dates from startDate
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${startDate}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + i)
    return d
  })

  const todayISO = startDate // startDate is always today from the server

  function selectDate(iso: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', iso)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
      {dates.map((date) => {
        const iso     = date.toISOString().slice(0, 10)
        const isToday = iso === todayISO
        const isSelected = iso === selectedDate
        const hasSlots   = (slotsPerDay[iso] ?? 0) > 0

        return (
          <button
            key={iso}
            onClick={() => selectDate(iso)}
            className={cn(
              'flex flex-col items-center justify-center min-w-[60px] h-[72px] rounded-xl border transition-all shrink-0',
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : isToday
                  ? 'border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 text-gray-600 bg-white hover:border-blue-300 hover:text-blue-600',
            )}
            aria-pressed={isSelected}
            aria-label={`Select ${iso}`}
          >
            <span className="text-xs font-medium">
              {DAY_LABELS[date.getUTCDay()]}
            </span>
            <span className="text-lg font-bold leading-tight">
              {date.getUTCDate()}
            </span>
            <span className="text-[10px] opacity-70">
              {MONTH_SHORT[date.getUTCMonth()]}
            </span>

            {/* Availability dot */}
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full mt-0.5 transition-colors',
                hasSlots
                  ? isSelected ? 'bg-white' : 'bg-green-500'
                  : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}