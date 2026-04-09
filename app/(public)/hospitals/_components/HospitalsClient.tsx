'use client'

/**
 * app/(public)/hospitals/_components/HospitalsClient.tsx
 *
 * Client Component.
 * - Shows all hospitals on load (passed as initialHospitals from server)
 * - Search bar debounces 350ms → fetches /api/hospitals/search?q=
 * - Results replace the grid without any navigation or page reload
 */

import { useState, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import HospitalCard        from './HospitalCard'
import HospitalCardSkeleton from './HospitalCardSkeleton'
import type { HospitalSearchResult } from '@/lib/booking/hospital'

interface Props {
  initialHospitals: HospitalSearchResult[]
}

const DEBOUNCE_MS = 350

export default function HospitalsClient({ initialHospitals }: Props) {
  const [query,     setQuery]     = useState('')
  const [hospitals, setHospitals] = useState<HospitalSearchResult[]>(initialHospitals)
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false) // true once user has typed
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/hospitals/search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as HospitalSearchResult[]
      setHospitals(data)
    } catch {
      // On error keep showing previous results
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSearched(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      runSearch(val.trim())
    }, DEBOUNCE_MS)
  }

  function handleClear() {
    setQuery('')
    setSearched(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setHospitals(initialHospitals)
  }

  return (
    <div>
      {/* ── Search bar ── */}
      <div className="flex items-center gap-2 max-w-xl mx-auto mb-8">
        <div className="relative flex-1">
          {loading ? (
            <Loader2
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none"
              size={18}
            />
          ) : (
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
            />
          )}
          <input
            type="text"
            placeholder="Search hospital, doctor, speciality or department…"
            value={query}
            onChange={handleChange}
            className="w-full pl-10 pr-10 h-11 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            aria-label="Search hospitals"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="text-sm text-gray-500 mb-5">
        {loading ? (
          'Searching…'
        ) : (
          <>
            {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''}
            {searched && query && (
              <> for &ldquo;<span className="font-medium text-gray-700">{query}</span>&rdquo;</>
            )}
          </>
        )}
      </p>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <HospitalCardSkeleton key={i} />
          ))}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium mb-2">No hospitals found</p>
          <p className="text-sm">
            No results for &ldquo;
            <span className="font-semibold text-gray-700">{query}</span>
            &rdquo;. Try a different name, speciality, or department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  )
}