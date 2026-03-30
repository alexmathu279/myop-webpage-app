'use client'

/**
 * app/(public)/book/clinic/_components/ClinicClient.tsx
 */

import { useState, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import ClinicCard        from './ClinicCard'
import ClinicCardSkeleton from './ClinicCardSkeleton'
import type { ClinicSearchResult } from '@/lib/booking/clinic'

interface Props {
  initialClinics: ClinicSearchResult[]
}

const DEBOUNCE_MS = 350

export default function ClinicClient({ initialClinics }: Props) {
  const [query,   setQuery]   = useState('')
  const [clinics, setClinics] = useState<ClinicSearchResult[]>(initialClinics)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/clinic/search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as ClinicSearchResult[]
      setClinics(data)
    } catch {
      // keep previous results
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSearched(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSearch(val.trim()), DEBOUNCE_MS)
  }

  function handleClear() {
    setQuery('')
    setSearched(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    setClinics(initialClinics)
  }

  return (
    <div>
      {/* Search bar */}
      <div className="flex items-center gap-2 max-w-xl mx-auto mb-8">
        <div className="relative flex-1">
          {loading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin pointer-events-none" size={18} />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          )}
          <input
            type="text"
            placeholder="Search clinic name, speciality or doctor…"
            value={query}
            onChange={handleChange}
            className="w-full pl-10 pr-10 h-11 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-5">
        {loading ? 'Searching…' : (
          <>
            {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}
            {searched && query && (
              <> for &ldquo;<span className="font-medium text-gray-700">{query}</span>&rdquo;</>
            )}
          </>
        )}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ClinicCardSkeleton key={i} />)}
        </div>
      ) : clinics.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium mb-2">No clinics found</p>
          <p className="text-sm">Try a different name or speciality.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clinics.map((clinic) => <ClinicCard key={clinic.id} clinic={clinic} />)}
        </div>
      )}
    </div>
  )
}