'use client'

/**
 * app/(public)/book/diagnostic/_components/DiagnosticClient.tsx
 * Inline debounced search — no page navigation on search.
 */

import { useState, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import DiagnosticCard        from './DiagnosticCard'
import DiagnosticCardSkeleton from './DiagnosticCardSkeleton'
import type { DiagnosticCentreSearchResult } from '@/lib/booking/diagnostic'

interface Props {
  initialCentres: DiagnosticCentreSearchResult[]
}

const DEBOUNCE_MS = 350

export default function DiagnosticClient({ initialCentres }: Props) {
  const [query,   setQuery]   = useState('')
  const [centres, setCentres] = useState<DiagnosticCentreSearchResult[]>(initialCentres)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/diagnostic/search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as DiagnosticCentreSearchResult[]
      setCentres(data)
    } catch {
      // keep previous results on error
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
    setCentres(initialCentres)
  }

  return (
    <div>
      {/* Search bar */}
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
            placeholder="Search centre name or test type…"
            value={query}
            onChange={handleChange}
            className="w-full pl-10 pr-10 h-11 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-5">
        {loading ? 'Searching…' : (
          <>
            {centres.length} centre{centres.length !== 1 ? 's' : ''}
            {searched && query && (
              <> for &ldquo;<span className="font-medium text-gray-700">{query}</span>&rdquo;</>
            )}
          </>
        )}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <DiagnosticCardSkeleton key={i} />)}
        </div>
      ) : centres.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium mb-2">No centres found</p>
          <p className="text-sm">
            No results for &ldquo;<span className="font-semibold text-gray-700">{query}</span>&rdquo;.
            Try a different name or test type.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {centres.map((centre) => (
            <DiagnosticCard key={centre.id} centre={centre} />
          ))}
        </div>
      )}
    </div>
  )
}